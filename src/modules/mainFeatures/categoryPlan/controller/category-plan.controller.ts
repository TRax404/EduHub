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
import { CategoryPlanService } from '../service/category-plan.service';
import { CreateCategoryPlanDto } from '../dto/create-category-plan.dto';
import { UpdateCategoryPlanDto } from '../dto/update-category-plan.dto';
import { Public } from '../../../../core/jwt/public.decorator';
import { RolesGuard } from '../../../../core/jwt/roles.guard';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Category Plan')
@Controller('category-plan')
export class CategoryPlanController {
  constructor(private readonly categoryPlanService: CategoryPlanService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Link a plan to a category (Admin only)' })
  async create(@Body() createCategoryPlanDto: CreateCategoryPlanDto) {
    const data = await this.categoryPlanService.create(createCategoryPlanDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Plan linked to category successfully',
      data,
    };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @Get()
  @ApiOperation({ summary: 'Get all category plan links (Admin only)' })
  async findAll() {
    const data = await this.categoryPlanService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Category plans retrieved successfully',
      data,
    };
  }

  @Public()
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get all plans for a specific category' })
  async findByCategoryId(@Param('categoryId') categoryId: string) {
    const data = await this.categoryPlanService.findByCategoryId(categoryId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category plans retrieved successfully',
      data,
    };
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Get category plan link by ID (Admin only)' })
  async findOne(@Param('id') id: string) {
    const data = await this.categoryPlanService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category plan retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Update a category plan link (Admin only)' })
  async update(@Param('id') id: string, @Body() updateCategoryPlanDto: UpdateCategoryPlanDto) {
    const data = await this.categoryPlanService.update(id, updateCategoryPlanDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Category plan updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Remove a plan from a category (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.categoryPlanService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Plan removed from category successfully',
    };
  }
}
