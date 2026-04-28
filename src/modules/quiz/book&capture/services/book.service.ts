import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { AdminAuditQueueProducer } from 'src/common/queues/producers/admin-audit-queue.producer';
import { AuditSeverity, AuditStatus } from 'src/common/queues/constants/queues.constants';
import { Prisma } from 'prisma/generated/prisma/client';

@Injectable()
export class BookService {
  private readonly context = 'BookService';

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly auditProducer: AdminAuditQueueProducer,
  ) { }

  /**
   * Creates a new book and logs the action.
   */
  async create(dto: CreateBookDto, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    try {
      // Check for customId uniqueness
      const existing = await this.prisma.book.findUnique({
        where: { customId: dto.customId },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(`Book with customId '${dto.customId}' already exists`);
      }

      const book = await this.prisma.book.create({
        data: {
          ...dto,
          negativeMark: dto.negativeMark ? new Prisma.Decimal(dto.negativeMark) : new Prisma.Decimal(1.0),
        },
      });

      this.logger.log(`Book created successfully: ${book.id} (${book.customId})`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'CREATE_BOOK',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext.userId,
        resource: 'Book',
        resourceId: book.id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { customId: book.customId, title: book.title },
      });

      return book;
    } catch (error: any) {
      this.logger.error(`Failed to create book: ${error.message}`, error.stack, this.context);

      // Audit Log - Failure
      await this.auditProducer.logAction({
        action: 'CREATE_BOOK',
        status: AuditStatus.FAILURE,
        severity: AuditSeverity.MEDIUM,
        userId: auditContext.userId,
        resource: 'Book',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { error: error.message, dto },
      });

      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('An unexpected error occurred while creating the book');
    }
  }

  /**
   * Retrieves all books with basic chapter information.
   */
  async findAll() {
    try {
      return await this.prisma.book.findMany({
        include: {
          _count: {
            select: { chapters: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      this.logger.error(`Failed to fetch books: ${error.message}`, error.stack, this.context);
      throw new InternalServerErrorException('Failed to retrieve books');
    }
  }

  /**
   * Retrieves a single book by ID with full details.
   */
  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: 'asc' }
        },
        difficultySettings: true,
      },
    });

    if (!book) {
      this.logger.warn(`Book retrieval failed: ID ${id} not found`, this.context);
      throw new NotFoundException(`Book with ID "${id}" not found`);
    }

    return book;
  }

  /**
   * Updates an existing book and logs the action.
   */
  async update(id: string, dto: UpdateBookDto, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    // Ensure book exists
    const original = await this.findOne(id);

    try {
      // Check for customId uniqueness if it's being updated
      if (dto.customId && dto.customId !== original.customId) {
        const existing = await this.prisma.book.findUnique({
          where: { customId: dto.customId },
          select: { id: true },
        });
        if (existing) {
          throw new ConflictException(`Cannot update: Book with customId '${dto.customId}' already exists`);
        }
      }

      const updatedBook = await this.prisma.book.update({
        where: { id },
        data: {
          ...dto,
          negativeMark: dto.negativeMark !== undefined ? new Prisma.Decimal(dto.negativeMark) : undefined,
        },
      });

      this.logger.log(`Book updated successfully: ${id}`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'UPDATE_BOOK',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext.userId,
        resource: 'Book',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: {
          changes: dto,
          previous: { title: original.title, customId: original.customId }
        },
      });

      return updatedBook;
    } catch (error: any) {
      this.logger.error(`Failed to update book ${id}: ${error.message}`, error.stack, this.context);

      // Audit Log - Failure
      await this.auditProducer.logAction({
        action: 'UPDATE_BOOK',
        status: AuditStatus.FAILURE,
        severity: AuditSeverity.MEDIUM,
        userId: auditContext.userId,
        resource: 'Book',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { error: error.message, dto },
      });

      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('An unexpected error occurred while updating the book');
    }
  }

  /**
   * Removes a book and its related records (handled by DB cascades or manual cleanup).
   */
  async remove(id: string, auditContext: { userId: string; ip?: string; userAgent?: string }) {
    const book = await this.findOne(id);

    try {
      await this.prisma.book.delete({
        where: { id },
      });

      this.logger.log(`Book deleted successfully: ${id}`, this.context);

      // Audit Log - Success
      await this.auditProducer.logAction({
        action: 'DELETE_BOOK',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.HIGH,
        userId: auditContext.userId,
        resource: 'Book',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { title: book.title, customId: book.customId },
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete book ${id}: ${error.message}`, error.stack, this.context);

      // Audit Log - Failure
      await this.auditProducer.logAction({
        action: 'DELETE_BOOK',
        status: AuditStatus.FAILURE,
        severity: AuditSeverity.HIGH,
        userId: auditContext.userId,
        resource: 'Book',
        resourceId: id,
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
        metadata: { error: error.message },
      });

      throw new InternalServerErrorException('Failed to delete the book');
    }
  }
}
