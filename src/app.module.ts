import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { StudentCategoryModule } from './modules/mainFeatures/studentCategory/student-category.module';
import { CategoryPlanModule } from './modules/mainFeatures/categoryPlan/category-plan.module';
import { SubscriptionModule } from './modules/mainFeatures/subscription/subscription.module';
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
import { FeatureModule } from './modules/mainFeatures/features/feature.module';
import { PlatformAdministratorModule } from './modules/admin/platfromAdministrator/administrator.module';
import { BadgeModule } from './modules/mainFeatures/badges/badge.module';
import { QuizModule } from './modules/quiz/quiz.module';

@Module({
  imports: [
    LoggerModule,
    QueuesModule,
    ScheduleModule.forRoot(),
    FileModule,
    ConfigurationModule,

    // Auth
    AuthModule,
    UserModule,

    // adminministator
    PlatformAdministratorModule,

    //main features
    StudentCategoryModule,
    CategoryPlanModule,
    FeatureModule,
    BadgeModule,
    SubscriptionModule,

    // quiz
    QuizModule,

    // core
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