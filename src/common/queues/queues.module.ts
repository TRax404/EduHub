import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { bullMqConnectionFromConfig } from '../redis/redis-options.factory';
import { QueueNames } from './constants/queues.constants';
import { AuthQueueProducer } from './producers/auth-queue.producer';
import { EmailQueueProducer } from './producers/email-queue.producer';
import { AuthProcessor } from './processors/auth.processor';
import { EmailProcessor } from './processors/email.processor';
import { DeadLetterProcessor } from './processors/dead-letter.processor';
import { MailModule } from '../mail/mail.module';

@Global()
@Module({
  imports: [
    MailModule,
    // ── Redis connection ──────────────────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: bullMqConnectionFromConfig(configService),
        prefix: configService.get<string>('redis.prefix', 'myapp'),
      }),
      inject: [ConfigService],
    }),

    // ── Auth queue ────────────────────────────────────────────────────────────
    BullModule.registerQueueAsync({
      name: QueueNames.AUTH,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            timeout: 20_000,
            // Per-job: AUTH_JOB_OPTIONS overrides attempts/backoff/removeOn*/timeout as needed.
          },
        };
      },
    }),

    // ── Email queue ───────────────────────────────────────────────────────────
    BullModule.registerQueueAsync({
      name: QueueNames.EMAIL,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('mail.MAIL_DRIVER', 'nodemailer');
        const mailHost = config.get<string>('mail.MAIL_HOST', '')?.toLowerCase();
        const isGoogleSmtp =
          mailHost.includes('gmail.com') || mailHost.includes('google');

        const limiter =
          driver === 'nodemailer' && isGoogleSmtp
            ? { max: 20, duration: 60_000 }
            : driver === 'aws'
              ? { max: 14, duration: 1_000 }
              : { max: 100, duration: 1_000 };

        return {
          limiter,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
            timeout: 45_000,
          },
        };
      },
    }),

    // ── Dead-letter queue ─────────────────────────────────────────────────────
    // Receives jobs that exhausted all retries in the auth queue.
    // Workers here can alert, store to S3, or trigger Slack notifications.
    BullModule.registerQueue({
      name: QueueNames.DEAD_LETTER,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { count: 500, age: 7 * 24 * 3600 },
        removeOnFail: { count: 200 },
      },
    }),
  ],

  providers: [
    AuthQueueProducer,
    EmailQueueProducer,
    AuthProcessor,
    EmailProcessor,
    DeadLetterProcessor,
  ],
  exports: [AuthQueueProducer, EmailQueueProducer, BullModule],
})
export class QueuesModule { }