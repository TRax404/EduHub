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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookService } from '../services/book.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { AtGuard } from 'src/core/jwt/guards/at.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';
import { Roles } from 'src/core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { GetUser } from 'src/core/jwt/get-user.decorator';


@ApiTags('Books')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard)
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new book (Admin/SuperAdmin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Book created successfully' })
  async create(
    @Body() createBookDto: CreateBookDto,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.bookService.create(createBookDto, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Book created successfully',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all books' })
  async findAll() {
    const data = await this.bookService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Books retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a book by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.bookService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Book retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a book (Admin/SuperAdmin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const data = await this.bookService.update(id, updateBookDto, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.OK,
      message: 'Book updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a book (Admin/SuperAdmin only)' })
  async remove(@Param('id') id: string) {
    await this.bookService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Book deleted successfully',
    };
  }
}
