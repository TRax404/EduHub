import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './common/swagger';
import { CustomLoggerService } from './common/logger/logger.service';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const customLogger = app.get(CustomLoggerService);
  app.useLogger(customLogger);

  app.useGlobalFilters(new AllExceptionsFilter(customLogger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 9000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Trust proxy for accurate client IP resolution from load balancers
  const httpAdapter = app.getHttpAdapter().getInstance();
  if (httpAdapter && typeof httpAdapter.set === 'function') {
    httpAdapter.set('trust proxy', 1);
  }

  // Security & Middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }));
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger
  if (nodeEnv !== 'production') {
    setupSwagger(app);
  }

  await app.listen(port, '0.0.0.0');
  customLogger.log(`🚀 Server is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();