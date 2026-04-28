import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BookController } from './book&capture/controller/book.controller';
import { ChapterController } from './book&capture/controller/chapter.controller';
import { BookService } from './book&capture/services/book.service';
import { ChapterService } from './book&capture/services/chapter.service';
import { QueuesModule } from 'src/common/queues/queues.module';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [BookController, ChapterController],
  providers: [BookService, ChapterService],
  exports: [BookService, ChapterService],
})
export class QuizModule { }
