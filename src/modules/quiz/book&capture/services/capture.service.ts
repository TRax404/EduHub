import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaptureImageDto } from '../dto/capture.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class CaptureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) { }


}
