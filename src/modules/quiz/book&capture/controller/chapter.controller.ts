import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ChapterService } from '../services/chapter.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { AtGuard } from 'src/core/jwt/guards/at.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';
import { Roles } from 'src/core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { GetUser } from 'src/core/jwt/get-user.decorator';

@ApiTags('Chapters')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chapter created successfully' })
  async create(
    @Body() createChapterDto: CreateChapterDto,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.chapterService.create(createChapterDto, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Chapter created successfully',
      data,
    };
  }

  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all chapters for a book' })
  async findByBook(@Param('bookId') bookId: string) {
    const data = await this.chapterService.findByBook(bookId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Chapters retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a chapter by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.chapterService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Chapter retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a chapter' })
  async update(
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.chapterService.update(id, updateChapterDto, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.OK,
      message: 'Chapter updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a chapter' })
  async remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.chapterService.remove(id, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.OK,
      message: 'Chapter deleted successfully',
    };
  }
}
