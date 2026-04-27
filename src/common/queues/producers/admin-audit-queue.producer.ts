import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { QueueNames, AdminAuditJobNames, ADMIN_AUDIT_JOB_OPTIONS } from '../constants/queues.constants';
import { AdminAuditLogInput } from '../types/admin-audit.type';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class AdminAuditQueueProducer {
  constructor(
    @InjectQueue(QueueNames.ADMIN_AUDIT) private readonly queue: Queue,
    private readonly logger: CustomLoggerService,
  ) {}

  async logAction(data: AdminAuditLogInput) {
    const jobId = uuidv4();
    const jobName = AdminAuditJobNames.LOG_ACTION;

    try {
      await this.queue.add(jobName, { ...data, jobId }, {
        ...ADMIN_AUDIT_JOB_OPTIONS[jobName],
        jobId, // BullMQ native jobId for built-in idempotency
      });
      
      this.logger.log(`Enqueued admin audit log: ${data.action} (resource: ${data.resource})`, 'AdminAuditQueueProducer');
    } catch (error) {
      this.logger.error(
        `Failed to enqueue admin audit log: ${error.message}`,
        error.stack,
        'AdminAuditQueueProducer',
      );
    }
  }
}
