import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CustomLoggerService } from '../../logger/logger.service';

export abstract class BaseProcessor extends WorkerHost {
    constructor(
        protected readonly logger: CustomLoggerService,
        protected readonly processorName: string,
    ) {
        super();
    }

    /**
     * Wraps a handler with structured logging and error re-throw.
     * The error is re-thrown so BullMQ can apply retry/backoff logic.
     */
    protected async exec<T>(job: Job, task: () => Promise<T>): Promise<T> {
        this.logger.log(
            `[${this.processorName}] Starting: ${job.name} (jobId=${job.id})`,
            this.processorName,
        );

        try {
            const result = await task();
            this.logger.log(
                `[${this.processorName}] Completed: ${job.name} (jobId=${job.id})`,
                this.processorName,
            );
            return result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(
                `[${this.processorName}] Failed: ${job.name} (jobId=${job.id}) — ${message}`,
                stack,
                this.processorName,
            );
            throw error;
        }
    }
}