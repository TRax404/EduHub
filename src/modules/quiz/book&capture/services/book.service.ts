import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';
import { AdminAuditQueueProducer } from 'src/common/queues/producers/admin-audit-queue.producer';
import { AuditSeverity, AuditStatus } from 'src/common/queues/constants/queues.constants';

@Injectable()
export class BookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly auditProducer: AdminAuditQueueProducer,
  ) { }

  async create(dto: CreateBookDto, auditContext?: { userId: string; ip?: string; userAgent?: string }) {
    try {
      const existing = await this.prisma.book.findUnique({
        where: { customId: dto.customId },
      });

      if (existing) {
        throw new ConflictException(`Book with customId ${dto.customId} already exists`);
      }

      const book = await this.prisma.book.create({
        data: {
          ...dto,
          negativeMark: dto.negativeMark ?? 1.0,
        },
      });

      this.logger.log(`Book created: ${book.id} (${book.customId})`, 'BookService');

      // Audit Log
      await this.auditProducer.logAction({
        action: 'CREATE_BOOK',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext?.userId,
        resource: 'Book',
        resourceId: book.id,
        ipAddress: auditContext?.ip,
        userAgent: auditContext?.userAgent,
        metadata: { customId: book.customId, name: book.name },
      });

      return book;
    } catch (error) {
      this.logger.error(`Failed to create book: ${(error as Error).message}`, 'BookService');

      // Audit Log for failure
      if (auditContext?.userId) {
        await this.auditProducer.logAction({
          action: 'CREATE_BOOK',
          status: AuditStatus.FAILURE,
          severity: AuditSeverity.MEDIUM,
          userId: auditContext.userId,
          resource: 'Book',
          ipAddress: auditContext.ip,
          userAgent: auditContext.userAgent,
          metadata: { error: (error as Error).message, dto },
        });
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.book.findMany({
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        chapters: true,
        difficultySettings: true,
      },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, dto: UpdateBookDto, auditContext?: { userId: string; ip?: string; userAgent?: string }) {
    const original = await this.findOne(id);

    try {
      const updatedBook = await this.prisma.book.update({
        where: { id },
        data: dto,
      });

      this.logger.log(`Book updated: ${id}`, 'BookService');

      // Audit Log
      await this.auditProducer.logAction({
        action: 'UPDATE_BOOK',
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        userId: auditContext?.userId,
        resource: 'Book',
        resourceId: id,
        ipAddress: auditContext?.ip,
        userAgent: auditContext?.userAgent,
        metadata: {
          changes: dto,
          previous: { name: original.name, customId: original.customId }
        },
      });

      return updatedBook;
    } catch (error) {
      this.logger.error(`Failed to update book ${id}: ${(error as Error).message}`, 'BookService');

      // Audit Log for failure
      if (auditContext?.userId) {
        await this.auditProducer.logAction({
          action: 'UPDATE_BOOK',
          status: AuditStatus.FAILURE,
          severity: AuditSeverity.MEDIUM,
          userId: auditContext.userId,
          resource: 'Book',
          resourceId: id,
          ipAddress: auditContext.ip,
          userAgent: auditContext.userAgent,
          metadata: { error: (error as Error).message, dto },
        });
      }

      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.prisma.book.delete({
        where: { id },
      });
      this.logger.log(`Book deleted: ${id}`, 'BookService');
    } catch (error) {
      this.logger.error(`Failed to delete book ${id}: ${(error as Error).message}`, 'BookService');
      throw error;
    }
  }
}
