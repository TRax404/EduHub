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

  async captureImage(userId: string, dto: CaptureImageDto, file: Express.Multer.File) {
    this.logger.log(`Processing image capture for book: ${dto.bookId} by user: ${userId}`, 'CaptureService');

    try {
      // 1. Validate Book & Chapter existence
      const book = await this.prisma.book.findUnique({
        where: { id: dto.bookId },
      });
      if (!book) throw new NotFoundException('Book not found');

      if (dto.chapterId) {
        const chapter = await this.prisma.chapter.findUnique({
          where: { id: dto.chapterId },
        });
        if (!chapter) throw new NotFoundException('Chapter not found');
      }

      // 2. Logic for Image Processing (Simulation)
      const extractedData = await this.simulateRekognition(file);

      // 3. Find Admin Profile
      const adminProfile = await this.prisma.adminProfile.findFirst({
        where: { profile: { userId: userId } }
      });

      if (!adminProfile) {
        throw new ForbiddenException('Admin profile not found for this user');
      }

      // 4. Save to AdminAuditLog
      const auditLog = await this.prisma.adminAuditLog.create({
        data: {
          adminId: adminProfile.id,
          action: 'CAPTURE_IMAGE',
          targetId: dto.bookId,
          details: {
            bookTitle: book.title,
            chapterId: dto.chapterId,
            notes: dto.notes,
            fileName: file.originalname,
            extractedData
          } as any,
        }
      });

      // 5. Update Admin total actions
      await this.prisma.adminProfile.update({
        where: { id: adminProfile.id },
        data: { totalActions: { increment: 1 } }
      });

      this.logger.activity(`Image captured and processed for book ${book.title}`, {
        userId,
        bookId: dto.bookId,
        auditLogId: auditLog.id
      }, 'CaptureActivity');

      return {
        id: auditLog.id,
        message: 'Image captured and processed successfully',
        bookTitle: book.title,
        ...extractedData,
        timestamp: auditLog.createdAt,
      };
    } catch (error) {
      this.logger.error(`Capture failed: ${(error as Error).message}`, 'CaptureService');
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException('Failed to process image capture');
    }
  }

  private async simulateRekognition(file: Express.Multer.File) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      text: `Extracted text from ${file.originalname}. This represents content from the book page.`,
      confidence: 0.985,
      detectedQuestions: [
        {
          text: 'What is the value of gravitational constant G?',
          optionA: '6.674×10^-11',
          optionB: '9.81',
          optionC: '3.00×10^8',
          optionD: '1.60×10^-19',
          correctAnswer: 'A',
          confidence: 0.95
        }
      ]
    };
  }

  async getCaptureHistory(userId: string) {
    this.logger.log(`Fetching capture history for user: ${userId}`, 'CaptureService');

    const adminProfile = await this.prisma.adminProfile.findFirst({
      where: { profile: { userId: userId } }
    });

    if (!adminProfile) {
      throw new ForbiddenException('Admin profile not found');
    }

    return this.prisma.adminAuditLog.findMany({
      where: {
        adminId: adminProfile.id,
        action: 'CAPTURE_IMAGE'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCaptureDetails(userId: string, id: string) {
    const adminProfile = await this.prisma.adminProfile.findFirst({
      where: { profile: { userId: userId } }
    });

    if (!adminProfile) {
      throw new ForbiddenException('Admin profile not found');
    }

    const log = await this.prisma.adminAuditLog.findUnique({
      where: { id }
    });

    if (!log || log.adminId !== adminProfile.id) {
      throw new NotFoundException('Capture log not found');
    }

    return log;
  }

  async deleteCapture(userId: string, id: string) {
    const adminProfile = await this.prisma.adminProfile.findFirst({
      where: { profile: { userId: userId } }
    });

    if (!adminProfile) {
      throw new ForbiddenException('Admin profile not found');
    }

    const log = await this.prisma.adminAuditLog.findUnique({
      where: { id }
    });

    if (!log || log.adminId !== adminProfile.id) {
      throw new NotFoundException('Capture log not found');
    }

    await this.prisma.adminAuditLog.delete({
      where: { id }
    });

    this.logger.log(`Capture log deleted: ${id} by admin: ${adminProfile.id}`, 'CaptureService');
    return { message: 'Capture history record deleted successfully' };
  }
}
