import { Processor, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { CustomLoggerService } from '../../logger/logger.service';
import { MailService } from '../../mail/mail.service';
import { QueueNames, EmailJobNames, DeadLetterJobNames } from '../constants/queues.constants';
import { BaseProcessor } from './base.processor';
import { OtpEmailJobData, WelcomeEmailJobData, OtpType } from '../types/email.type';
import { DeadLetterJobData } from '../types/auth.type';
import { sanitizeOriginalDataForDlq } from '../utils/dlq-sanitize.util';

@Processor(QueueNames.EMAIL, {
  concurrency: 5,
  removeOnComplete: { count: 1000 },
})
export class EmailProcessor extends BaseProcessor {
  constructor(
    private readonly mailService: MailService,
    logger: CustomLoggerService,
    @InjectQueue(QueueNames.DEAD_LETTER)
    private readonly deadLetterQueue: Queue,
  ) {
    super(logger, 'EmailProcessor');
  }

  async process(job: Job): Promise<unknown> {
    switch (job.name) {
      case EmailJobNames.SEND_WELCOME_EMAIL:
        return this.exec(job, () =>
          this.handleWelcomeEmail(job.data as WelcomeEmailJobData),
        );

      case EmailJobNames.SEND_OTP_EMAIL:
        return this.exec(job, () =>
          this.handleOtpEmail(job.data as OtpEmailJobData),
        );

      default:
        this.logger.warn(`Unrecognized job: "${job.name}"`, 'EmailProcessor');
        return null;
    }
  }

  private async handleWelcomeEmail(data: WelcomeEmailJobData) {
    await this.mailService.sendMail({
      to: data.email,
      subject: 'Welcome to EduTech!',
      template: 'welcome',
      context: {
        name: data.name,
      },
    });
  }

  private async handleOtpEmail(data: OtpEmailJobData) {
    let subject = 'Your OTP Code';
    let template = 'otp'; // Assuming an otp template exists or will be created

    switch (data.type) {
      case OtpType.REGISTER:
        subject = 'EduTech - Registration OTP';
        break;
      case OtpType.FORGOT_PASSWORD:
        subject = 'EduTech - Forgot Password OTP';
        break;
      case OtpType.RESET_PASSWORD:
        subject = 'EduTech - Reset Password OTP';
        break;
    }

    await this.mailService.sendMail({
      to: data.email,
      subject: subject,
      template: template,
      context: {
        otp: data.otp,
        type: data.type,
      },
    });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Job completed [${job.id}] name="${job.name}"`,
      'EmailProcessor',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job | undefined, error: Error) {
    if (!job) {
      this.logger.error('Unknown job failed', error?.stack, 'EmailProcessor');
      return;
    }

    const maxAttempts = job.opts?.attempts ?? 1;
    const isExhausted = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `Job failed [${job.id}] name="${job.name}" attempt=${job.attemptsMade}/${maxAttempts} — ${isExhausted ? 'EXHAUSTED → DLQ' : 'will retry'}`,
      error?.stack,
      'EmailProcessor',
    );

    if (isExhausted) {
      const dlqPayload: DeadLetterJobData = {
        originalQueue: QueueNames.EMAIL,
        originalJobName: job.name,
        originalJobId: job.id,
        originalData: sanitizeOriginalDataForDlq(
          QueueNames.EMAIL,
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
          'EmailProcessor',
        );
      }
    }
  }
}
