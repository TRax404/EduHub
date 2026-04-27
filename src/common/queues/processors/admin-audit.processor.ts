import { Processor, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomLoggerService } from '../../logger/logger.service';
import { QueueNames, AdminAuditJobNames, DeadLetterJobNames } from '../constants/queues.constants';
import { BaseProcessor } from './base.processor';
import { Prisma } from 'prisma/generated/prisma/client';
import { AdminAuditLogJobData } from '../types/admin-audit.type';
import { DeadLetterJobData } from '../types/auth.type';
import { sanitizeOriginalDataForDlq } from '../utils/dlq-sanitize.util';

@Processor(QueueNames.ADMIN_AUDIT, {
  concurrency: 5,
  removeOnComplete: { count: 1000 },
})
export class AdminAuditProcessor extends BaseProcessor {
  constructor(
    private readonly prisma: PrismaService,
    logger: CustomLoggerService,
    @InjectQueue(QueueNames.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {
    super(logger, 'AdminAuditProcessor');
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case AdminAuditJobNames.LOG_ACTION:
        return this.exec(job, () =>
          this.handleLogAction(job.data as AdminAuditLogJobData),
        );

      default:
        this.logger.warn(`Unrecognized job: "${job.name}"`, 'AdminAuditProcessor');
        return null;
    }
  }

  private async handleLogAction(data: AdminAuditLogJobData) {
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

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Job completed [${job.id}] name="${job.name}"`,
      'AdminAuditProcessor',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) {
      this.logger.error('Unknown job failed', error?.stack, 'AdminAuditProcessor');
      return;
    }

    const maxAttempts = job.opts?.attempts ?? 1;
    const isExhausted = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job failed [${job.id}] name="${job.name}" attempt=${job.attemptsMade}/${maxAttempts} — ${isExhausted ? 'EXHAUSTED → DLQ' : 'will retry'}`,
      error?.stack,
      'AdminAuditProcessor',
    );

    if (isExhausted) {
      const dlqPayload: DeadLetterJobData = {
        originalQueue: QueueNames.ADMIN_AUDIT,
        originalJobName: job.name as AdminAuditJobNames,
        originalJobId: job.id,
        originalData: sanitizeOriginalDataForDlq(
          QueueNames.ADMIN_AUDIT,
          job.name,
          job.data,
        ),
        errorMessage: error?.message ?? 'unknown',
        errorStack: error?.stack,
        attemptsMade: job.attemptsMade,
        exhaustedAt: new Date().toISOString(),
      };

      try {
        await this.deadLetterQueue.add(DeadLetterJobNames.FAILED_JOB, dlqPayload, {
          attempts: 1,
          removeOnComplete: { count: 500, age: 7 * 24 * 3600 },
          removeOnFail: false,
        });
      } catch (dlqError: unknown) {
        const msg = dlqError instanceof Error ? dlqError.message : String(dlqError);
        this.logger.error(
          `CRITICAL: Failed to push exhausted job [${job.id}] to DLQ — ${msg}`,
          dlqError instanceof Error ? dlqError.stack : undefined,
          'AdminAuditProcessor',
        );
      }
    }
  }
}
