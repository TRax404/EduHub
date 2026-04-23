import { Module } from '@nestjs/common';
import { CategoryPlanController } from './controller/category-plan.controller';
import { CategoryPlanService } from './service/category-plan.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryPlanController],
  providers: [CategoryPlanService],
  exports: [CategoryPlanService],
})
export class CategoryPlanModule {}
