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
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { JwtAuthGuard } from 'src/core/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';

@ApiTags('Category Plan')
@Controller('category-plan')
export class CategoryPlanController {
  constructor(private readonly categoryPlanService: CategoryPlanService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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

  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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


  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Remove a plan from a category (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.categoryPlanService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Plan removed from category successfully',
    };
  }
}
