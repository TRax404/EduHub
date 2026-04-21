import { Processor, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BaseProcessor } from './base.processor';
import { CustomLoggerService } from '../../logger/logger.service';
import { DeadLetterJobNames, QueueNames } from '../constants/queues.constants';
import { DeadLetterJobData } from '../types/auth.type';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from 'prisma/generated/prisma/client';
import { sanitizeOriginalDataForDlq } from '../utils/dlq-sanitize.util';

/**
 * DeadLetterProcessor
 *
 * Handles jobs that exhausted all retries in the auth queue.
 * Responsibilities:
 *   1. Log a critical alert
 *   2. Persist the dead job for replay or manual investigation
 *   3. Expose metrics
 */
@Processor(QueueNames.DEAD_LETTER, {
    concurrency: 2,
    removeOnComplete: { count: 500, age: 7 * 24 * 3600 },
})
export class DeadLetterProcessor extends BaseProcessor {
    constructor(
        logger: CustomLoggerService,
        private readonly prisma: PrismaService,
    ) {
        super(logger, 'DeadLetterProcessor');
    }

    async process(job: Job): Promise<unknown> {
        switch (job.name) {
            case DeadLetterJobNames.FAILED_JOB:
                return this.exec(job, () =>
                    this.handleFailedJob(job.data as DeadLetterJobData),
                );

            default:
                this.logger.warn(
                    `Unrecognized DLQ job: "${job.name}"`,
                    'DeadLetterProcessor',
                );
                return null;
        }
    }

    private async handleFailedJob(data: DeadLetterJobData): Promise<void> {
        // ── 1. Critical log ──────────────────────────────────────────────────────
        this.logger.error(
            `DEAD LETTER: job "${data.originalJobName}" (id=${data.originalJobId}) ` +
            `exhausted after ${data.attemptsMade} attempts at ${data.exhaustedAt}. ` +
            `Error: ${data.errorMessage}`,
            data.errorStack,
            'DeadLetterProcessor',
        );

        // ── 2. Persist for replay ────────────────────────────────────────────────
        try {
            const safePayload = sanitizeOriginalDataForDlq(
                data.originalQueue,
                data.originalJobName,
                data.originalData,
            );
            await this.prisma.deadLetterJob.create({
                data: {
                    originalQueue: data.originalQueue,
                    originalJobId: data.originalJobId,
                    jobName: data.originalJobName,
                    payload: safePayload as unknown as Prisma.InputJsonValue,
                    errorMessage: data.errorMessage,
                    errorStack: data.errorStack,
                    attemptsMade: data.attemptsMade,
                    exhaustedAt: new Date(data.exhaustedAt),
                },
            });
        } catch (dbError: unknown) {
            const msg = dbError instanceof Error ? dbError.message : String(dbError);
            this.logger.error(
                `CRITICAL: Failed to persist dead letter job to database — ${msg}`,
                dbError instanceof Error ? dbError.stack : undefined,
                'DeadLetterProcessor',
            );
        }

        // ── 3. Alert hook ────────────────────────────────────────────────────────
        // TODO: inject AlertService and call:
        //   await this.alertService.sendCritical({
        //     title: `Queue job failed permanently`,
        //     job: data.originalJobName,
        //     jobId: data.originalJobId,
        //     error: data.errorMessage,
        //   });
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(
            `DLQ job processed [${job.id}] name="${job.name}"`,
            'DeadLetterProcessor',
        );
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job | undefined, error: Error) {
        this.logger.error(
            `CRITICAL: DLQ processor failed for job [${job?.id ?? 'unknown'}] — ${error?.message}`,
            error?.stack,
            'DeadLetterProcessor',
        );
    }
}
