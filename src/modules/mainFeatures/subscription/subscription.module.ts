import { Module } from '@nestjs/common';
import { SubscriptionPlanService } from './service/subscription-plan.service';
import { SubscriptionPlanController } from './controller/subscription-plan.controller';
import { SubscriptionService } from './service/subscription.service';
import { SubscriptionController } from './controller/subscription.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubscriptionPlanController, SubscriptionController],
  providers: [SubscriptionPlanService, SubscriptionService],
  exports: [SubscriptionPlanService, SubscriptionService],
})
export class SubscriptionModule {}
