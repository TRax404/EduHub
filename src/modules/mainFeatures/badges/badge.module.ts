import { Module } from '@nestjs/common';
import { BadgeController } from './controller/badge.controller';
import { BadgeService } from './service/badge.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
