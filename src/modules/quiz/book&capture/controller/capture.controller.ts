import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CaptureService } from '../services/capture.service';
import { CaptureImageDto } from '../dto/capture.dto';
import { AtGuard } from 'src/core/jwt/guards/at.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';
import { Roles } from 'src/core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';

@ApiTags('Capture')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Controller('capture')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}

  @Post('image')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Capture and process an image of a book page (Admin/SuperAdmin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        bookId: { type: 'string' },
        chapterId: { type: 'string' },
        notes: { type: 'string' },
      },
    },
  })
  async captureImage(
    @Body() dto: CaptureImageDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const data = await this.captureService.captureImage(dto, file);
    return {
      statusCode: HttpStatus.OK,
      message: 'Image processed successfully',
      data,
    };
  }
}

