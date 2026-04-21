import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { createHash, randomUUID } from 'crypto';
import { CustomLoggerService } from '../../logger/logger.service';
import {
    QueueNames,
    AuthJobNames,
    AUTH_JOB_OPTIONS,
} from '../constants/queues.constants';
import {
    AuditLogInput,
    AuditLogJobData,
    LoginHistoryInput,
    LoginHistoryJobData,
} from '../types/auth.type';

@Injectable()
export class AuthQueueProducer {
    constructor(
        @InjectQueue(QueueNames.AUTH) private readonly authQueue: Queue,
        private readonly logger: CustomLoggerService,
    ) { }

    /**
     * Internal enqueue helper with full typing.
     * jobId is always generated here so callers never forget it.
     */
    private async enqueue<T extends { jobId: string }>(
        jobName: AuthJobNames,
        data: T,
    ): Promise<Job<T>> {
        try {
            const options = AUTH_JOB_OPTIONS[jobName];
            const job = await this.authQueue.add(jobName, data, {
                ...options,
                // Use the domain jobId as the BullMQ job ID so duplicate
                // detection works even if the producer crashes and retries.
                jobId: data.jobId,
            });
            this.logger.log(
                `Job enqueued [${job.id}] name="${jobName}"`,
                'AuthQueueProducer',
            );
            return job as Job<T>;
        } catch (error: unknown) {
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to enqueue "${jobName}"`,
                stack,
                'AuthQueueProducer',
            );
            throw error;
        }
    }

    /**
     * Enqueue a login history record.
     * jobId is auto-generated — callers pass only domain data.
     */
    async addLoginHistoryJob(input: LoginHistoryInput): Promise<Job<LoginHistoryJobData>> {
        // Deterministic ID for pseudo-idempotency if HTTP drops
        const hash = createHash('md5')
            .update(`login-${input.userId}-${input.device}-${Math.floor(Date.now() / 60000)}`)
            .digest('hex');
            
        const data: LoginHistoryJobData = {
            ...input,
            jobId: hash,
        };
        return this.enqueue(AuthJobNames.CREATE_LOGIN_HISTORY, data);
    }

    /**
     * Enqueue an audit log record.
     * jobId is auto-generated — callers pass only domain data.
     */
    async addAuditLogJob(input: AuditLogInput): Promise<Job<AuditLogJobData>> {
        const hash = createHash('md5')
            .update(`audit-${input.userId || 'sys'}-${input.action}-${Math.floor(Date.now() / 60000)}`)
            .digest('hex');
            
        const data: AuditLogJobData = {
            ...input,
            jobId: hash,
        };
        return this.enqueue(AuthJobNames.RECORD_AUDIT_LOG, data);
    }
}