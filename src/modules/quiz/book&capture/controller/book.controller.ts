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
import { BookService } from '../services/book.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { AtGuard } from 'src/core/jwt/guards/at.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';
import { Roles } from 'src/core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { GetUser } from 'src/core/jwt/get-user.decorator';

@ApiTags('Books')
@UseGuards(AtGuard, RolesGuard)
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Book created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Book with customId already exists' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
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
  @ApiResponse({ status: HttpStatus.OK, description: 'List of books retrieved successfully' })
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
  @ApiParam({ name: 'id', description: 'The unique ID of the book' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Book details retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
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
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'id', description: 'The unique ID of the book' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Book updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Updated customId already exists' })
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
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', description: 'The unique ID of the book' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Book deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  async remove(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.bookService.remove(id, { userId, ip, userAgent });
    return {
      statusCode: HttpStatus.OK,
      message: 'Book deleted successfully',
    };
  }
}
