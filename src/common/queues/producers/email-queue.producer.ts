import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { createHash, randomUUID } from 'crypto';
import { CustomLoggerService } from '../../logger/logger.service';
import {
    QueueNames,
    EmailJobNames,
    EMAIL_JOB_OPTIONS,
} from '../constants/queues.constants';
import {
    OtpEmailInput,
    OtpEmailJobData,
    WelcomeEmailInput,
    WelcomeEmailJobData,
} from '../types/email.type';

@Injectable()
export class EmailQueueProducer {
    constructor(
        @InjectQueue(QueueNames.EMAIL) private readonly emailQueue: Queue,
        private readonly logger: CustomLoggerService,
    ) { }

    /**
     * Internal enqueue helper with full typing.
     */
    private async enqueue<T extends { jobId: string }>(
        jobName: EmailJobNames,
        data: T,
    ): Promise<Job<T>> {
        try {
            const options = EMAIL_JOB_OPTIONS[jobName];
            const job = await this.emailQueue.add(jobName, data, {
                ...options,
                jobId: data.jobId,
            });
            this.logger.log(
                `Job enqueued [${job.id}] name="${jobName}"`,
                'EmailQueueProducer',
            );
            return job as Job<T>;
        } catch (error: unknown) {
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `Failed to enqueue "${jobName}"`,
                stack,
                'EmailQueueProducer',
            );
            throw error;
        }
    }

    async addWelcomeEmailJob(input: WelcomeEmailInput): Promise<Job<WelcomeEmailJobData>> {
        const hash = createHash('md5')
            .update(`welcome-${input.email}-${Math.floor(Date.now() / 60000)}`)
            .digest('hex');
            
        const data: WelcomeEmailJobData = {
            ...input,
            jobId: hash,
        };
        return this.enqueue(EmailJobNames.SEND_WELCOME_EMAIL, data);
    }

    async addOtpEmailJob(input: OtpEmailInput): Promise<Job<OtpEmailJobData>> {
        const hash = createHash('md5')
            .update(`otp-${input.email}-${input.type}-${Math.floor(Date.now() / 60000)}`)
            .digest('hex');
            
        const data: OtpEmailJobData = {
            ...input,
            jobId: hash,
        };
        return this.enqueue(EmailJobNames.SEND_OTP_EMAIL, data);
    }
}
