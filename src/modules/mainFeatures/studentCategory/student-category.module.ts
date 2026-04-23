import { Module } from '@nestjs/common';
import { StudentCategoryController } from './controller/student-category.controller';
import { StudentCategoryService } from './service/student-category.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentCategoryController],
  providers: [StudentCategoryService],
  exports: [StudentCategoryService],
})
export class StudentCategoryModule {}
