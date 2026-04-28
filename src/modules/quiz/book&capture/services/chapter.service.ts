import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { AdminAuditQueueProducer } from 'src/common/queues/producers/admin-audit-queue.producer';
import { AuditSeverity, AuditStatus } from 'src/common/queues/constants/queues.constants';

@Injectable()
export class ChapterService {
  private readonly context = 'ChapterService';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly auditProducer: AdminAuditQueueProducer,
  ) { }

  /**
   * Creates a new chapter for a book.
   */
  async create(dto: CreateChapterDto, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    try {
      // 1. Verify Book exists
      const book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
      if (!book) throw new NotFoundException(`Book with ID "${dto.bookId}" not found`);

      // 2. Check for duplicate order in the same book
      const existingOrder = await this.prisma.chapter.findFirst({
        where: { bookId: dto.bookId, order: dto.order },
      });
      if (existingOrder) {
        throw new ConflictException(`Chapter with order ${dto.order} already exists in this book`);
      }

      const chapter = await this.prisma.chapter.create({
        data: dto,
      });

      this.logger.log(`Chapter created: ${chapter.id} for book ${dto.bookId}`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'CREATE_CHAPTER',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext.userId,
        resource: 'Chapter',
        resourceId: chapter.id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { bookId: dto.bookId, title: chapter.title },
      });

      return chapter;
    } catch (error: any) {
      this.logger.error(`Failed to create chapter: ${error.message}`, error.stack, this.context);

      // Audit Log - Failure
      await this.auditProducer.logAction({
        action: 'CREATE_CHAPTER',
        status: AuditStatus.FAILURE,
        severity: AuditSeverity.MEDIUM,
        userId: auditContext.userId,
        resource: 'Chapter',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { error: error.message, dto },
      });

      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('An unexpected error occurred while creating the chapter');
    }
  }

  /**
   * Retrieves all chapters for a specific book.
   */
  async findByBook(bookId: string) {
    return this.prisma.chapter.findMany({
      where: { bookId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Retrieves a single chapter by ID.
   */
  async findOne(id: string) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        book: { select: { title: true, customId: true } },
        _count: { select: { questions: true } },
      },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter with ID "${id}" not found`);
    }

    return chapter;
  }

  /**
   * Updates an existing chapter.
   */
  async update(id: string, dto: UpdateChapterDto, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    const original = await this.findOne(id);

    try {
      // If order is changing, check for duplicates in the same book
      if (dto.order !== undefined && dto.order !== original.order) {
        const existingOrder = await this.prisma.chapter.findFirst({
          where: { bookId: original.bookId, order: dto.order },
        });
        if (existingOrder) {
          throw new ConflictException(`Chapter with order ${dto.order} already exists in this book`);
        }
      }

      const updatedChapter = await this.prisma.chapter.update({
        where: { id },
        data: dto,
      });

      this.logger.log(`Chapter updated: ${id}`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'UPDATE_CHAPTER',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext.userId,
        resource: 'Chapter',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { changes: dto, previous: { title: original.title, order: original.order } },
      });

      return updatedChapter;
    } catch (error: any) {
      this.logger.error(`Failed to update chapter ${id}: ${error.message}`, error.stack, this.context);

      // Audit Log - Failure
      await this.auditProducer.logAction({
        action: 'UPDATE_CHAPTER',
        status: AuditStatus.FAILURE,
        severity: AuditSeverity.MEDIUM,
        userId: auditContext.userId,
        resource: 'Chapter',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { error: error.message, dto },
      });

      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('An unexpected error occurred while updating the chapter');
    }
  }

  /**
   * Removes a chapter.
   */
  async remove(id: string, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    const chapter = await this.findOne(id);

    try {
      await this.prisma.chapter.delete({ where: { id } });

      this.logger.log(`Chapter deleted: ${id}`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'DELETE_CHAPTER',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.MEDIUM,
        userId: auditContext.userId,
        resource: 'Chapter',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { title: chapter.title, bookId: chapter.bookId },
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete chapter ${id}: ${error.message}`, error.stack, this.context);
      throw new InternalServerErrorException('Failed to delete chapter');
    }
  }
}
