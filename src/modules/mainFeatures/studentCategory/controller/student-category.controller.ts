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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { StudentCategoryService } from '../service/student-category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Public } from '../../../../core/jwt/public.decorator';
import { RolesGuard } from '../../../../core/jwt/roles.guard';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Student Category')
@Controller('student-category')
export class StudentCategoryController {
  constructor(private readonly studentCategoryService: StudentCategoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const data = await this.studentCategoryService.create(createCategoryDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll() {
    const data = await this.studentCategoryService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Categories retrieved successfully',
      data,
    };
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get category tree' })
  async getTree() {
    const data = await this.studentCategoryService.getTree();
    return {
      statusCode: HttpStatus.OK,
      message: 'Category tree retrieved successfully',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.studentCategoryService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const data = await this.studentCategoryService.update(id, updateCategoryDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Delete a category (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.studentCategoryService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category deleted successfully',
    };
  }
}
