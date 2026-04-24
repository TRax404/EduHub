import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PlatformAdministratorController } from './controller/platform-administrator.controller';
import { PlatformAdministratorService } from './services/platform-administrator.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformAdministratorController],
  providers: [PlatformAdministratorService],
})
export class PlatformAdministratorModule { }
