import { Processor, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { QueueNames, AuthJobNames, DeadLetterJobNames } from '../constants/queues.constants';
import { BaseProcessor } from './base.processor';
import { Prisma } from 'prisma/generated/prisma/client';
import { AuditLogJobData, LoginHistoryJobData, DeadLetterJobData } from '../types/auth.type';
import { sanitizeOriginalDataForDlq } from '../utils/dlq-sanitize.util';

@Processor(QueueNames.AUTH, {
  /**
   * concurrency: 10 — matches the Prisma default connection pool size.
   * Raise only if you also raise DATABASE_CONNECTION_LIMIT in your config.
   */
  concurrency: 10,
  removeOnComplete: { count: 1000 },
})
export class AuthProcessor extends BaseProcessor {
  constructor(
    private readonly prisma: PrismaService,
    logger: CustomLoggerService,
    @InjectQueue(QueueNames.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {
    super(logger, 'AuthProcessor');
  }

  // ─── Job router ─────────────────────────────────────────────────────────────

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case AuthJobNames.CREATE_LOGIN_HISTORY:
        return this.exec(job, () =>
          this.handleLoginHistory(job.data as LoginHistoryJobData),
        );

      case AuthJobNames.RECORD_AUDIT_LOG:
        return this.exec(job, () =>
          this.handleAuditLog(job.data as AuditLogJobData),
        );

      default:
        this.logger.warn(`Unrecognized job: "${job.name}"`, 'AuthProcessor');
        return null;
    }
  }




  // ─── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Idempotent: uses upsert keyed on jobId.
   * Requires schema: loginHistory.jobId String @unique
   *
   * On retry, the upsert finds the existing row and updates nothing (update: {}).
   * This guarantees at-most-once semantics even if the DB commit succeeded
   * but the ACK to BullMQ was lost.
   */
  private async handleLoginHistory(data: LoginHistoryJobData) {
    return this.prisma.loginHistory.upsert({
      where: { jobId: data.jobId },
      update: {},
      create: {
        jobId: data.jobId,
        userId: data.userId,
        ipAddress: data.ipAddress,
        device: data.device,
        geoLocation: data.geoLocation ?? null,
        isSuspicious: data.isSuspicious ?? false,
        loginMethod: data.loginMethod ?? null,
        mfaUsed: data.mfaUsed ?? false,
        startedAt: new Date(),
      },
    });
  }

  // audit log
  private async handleAuditLog(data: AuditLogJobData) {
    return this.prisma.auditLog.upsert({
      where: { jobId: data.jobId },
      update: {},
      create: {
        jobId: data.jobId,
        userId: data.userId ?? null,
        action: data.action,
        status: data.status,
        severity: data.severity,
        resource: data.resource ?? null,
        resourceId: data.resourceId ?? null,
        correlationId: data.correlationId ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        metadata: (data.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  }

  // ─── BullMQ lifecycle events ─────────────────────────────────────────────────

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Job completed [${job.id}] name="${job.name}"`,
      'AuthProcessor',
    );
  }

  /**
   * When all retry attempts are exhausted, push to the dead-letter queue
   * instead of silently discarding the job.
   *
   * The DLQ processor can: alert on-call, write to S3, expose a replay API, etc.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) {
      this.logger.error('Unknown job failed', error?.stack, 'AuthProcessor');
      return;
    }

    const maxAttempts = job.opts?.attempts ?? 1;
    const isExhausted = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job failed [${job.id}] name="${job.name}" attempt=${job.attemptsMade}/${maxAttempts} — ${isExhausted ? 'EXHAUSTED → DLQ' : 'will retry'}`,
      error?.stack,
      'AuthProcessor',
    );

    if (isExhausted) {
      const dlqPayload: DeadLetterJobData = {
        originalQueue: QueueNames.AUTH,
        originalJobName: job.name as AuthJobNames,
        originalJobId: job.id,
        originalData: sanitizeOriginalDataForDlq(
          QueueNames.AUTH,
          job.name,
          job.data,
        ) as LoginHistoryJobData | AuditLogJobData,
        errorMessage: error?.message ?? 'unknown',
        errorStack: error?.stack,
        attemptsMade: job.attemptsMade,
        exhaustedAt: new Date().toISOString(),
      };

      try {
        await this.deadLetterQueue.add(DeadLetterJobNames.FAILED_JOB, dlqPayload, {
          // DLQ jobs should not retry — they need human/automated review
          attempts: 1,
          removeOnComplete: { count: 500, age: 7 * 24 * 3600 }, // keep 7 days
          removeOnFail: false, // keep failed DLQ jobs indefinitely for audit
        });
      } catch (dlqError: unknown) {
        // DLQ itself failing is a critical alert — log loudly
        const msg = dlqError instanceof Error ? dlqError.message : String(dlqError);
        this.logger.error(
          `CRITICAL: Failed to push exhausted job [${job.id}] to DLQ — ${msg}`,
          dlqError instanceof Error ? dlqError.stack : undefined,
          'AuthProcessor',
        );
      }
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(
      `Job stalled [${jobId}] — possible worker crash or timeout`,
      'AuthProcessor',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error(
      `Worker global error: ${error.message}`,
      error.stack,
      'AuthProcessor',
    );
  }
}