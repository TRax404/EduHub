import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookController } from './book&capture/controller/book.controller';
import { CaptureController } from './book&capture/controller/capture.controller';
import { BookService } from './book&capture/services/book.service';
import { CaptureService } from './book&capture/services/capture.service';
import { QueuesModule } from 'src/common/queues/queues.module';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [BookController, CaptureController],
  providers: [BookService, CaptureService],
  exports: [BookService, CaptureService],
})
export class QuizModule { }
