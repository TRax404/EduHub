import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AtStrategy } from './core/jwt/strategies/at.strategy';
import { RedisModule } from './common/redis/redis.module';
import { FileModule } from './lib/file/file.module';
import { SeederService } from './core/seed/seed.service';
import { QueuesModule } from './common/queues/queues.module';
import { LoggerModule } from './common/logger/logger.module';
import { AtGuard } from './core/jwt/guards/at.guard';
import { APP_GUARD } from '@nestjs/core';
import { MailModule } from './common/mail/mail.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './common/logger/metrics.controller';

@Module({
  imports: [
    LoggerModule,
    QueuesModule,
    ScheduleModule.forRoot(),
    FileModule,
    ConfigurationModule,
    AuthModule,
    UserModule,
    PrismaModule,
    RedisModule,
    MailModule,
    PrometheusModule.register({
      path: '/metrics',
      controller: MetricsController,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AtStrategy,
    SeederService,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule { }