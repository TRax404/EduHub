import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get<string>('node_env', 'development');
    let lokiUrl = this.configService.get<string>('loki.url', 'http://localhost:3100');

    // Senior dev tip: If running locally but config says 'loki', redirect to localhost
    if (lokiUrl.includes('://loki:') && !process.env.DOCKER_CONTAINER) {
      lokiUrl = lokiUrl.replace('://loki:', '://localhost:');
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ms }) => {
            return `[Winston] - ${timestamp} ${level} [${context || 'App'}] ${message} ${ms}`;
          }),
        ),
      }),
    ];

    if (nodeEnv !== 'test') {
      const lokiTransport = new LokiTransport({
        host: lokiUrl,
        labels: { app: 'Eduhub-api', env: nodeEnv },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.error('Loki connection error', err),
      });

      transports.push(lokiTransport);
    }

    this.logger = winston.createLogger({
      level: nodeEnv === 'production' ? 'info' : 'debug',
      transports,
    });

    // Send a test log immediately to verify connection
    this.logger.info('Logger initialized and connected to Loki', { context: 'Bootstrap' });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { stack, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom activity log method
  activity(message: string, user: Record<string, unknown>, context?: string) {
    this.logger.info(message, { user, context: context || 'UserActivity' });
  }
}
