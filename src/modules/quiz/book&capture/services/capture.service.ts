import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CaptureImageDto } from '../dto/capture.dto';
import { CustomLoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class CaptureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) { }

  async captureImage(dto: CaptureImageDto, file: Express.Multer.File) {
    this.logger.log(`Processing image capture for book: ${dto.bookId}`, 'CaptureService');

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
      // Senior dev note: In production, we'd use AWS Rekognition or similar.
      // We should also handle file upload to S3 here.

      const extractedData = await this.simulateRekognition(file);

      // 3. Log the successful capture
      this.logger.activity(`Image captured and processed for book ${book.title}`, {
        bookId: dto.bookId,
        chapterId: dto.chapterId,
        fileName: file.originalname
      }, 'CaptureActivity');

      return {
        message: 'Image captured and processed successfully',
        bookTitle: book.title,
        ...extractedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Capture failed: ${(error as Error).message}`, 'CaptureService');
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to process image capture');
    }
  }

  private async simulateRekognition(file: Express.Multer.File) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      text: `Extracted text from ${file.originalname}`,
      confidence: 0.985,
      detectedQuestions: [
        {
          text: 'What is the value of gravitational constant G?',
          options: ['6.674×10^-11', '9.81', '3.00×10^8', '1.60×10^-19'],
          confidence: 0.95
        }
      ]
    };
  }

  async getCaptureHistory(userId: string) {
    // Senior dev tip: Implement pagination for history
    this.logger.log(`Fetching capture history for user: ${userId}`, 'CaptureService');
    return [];
  }
}
