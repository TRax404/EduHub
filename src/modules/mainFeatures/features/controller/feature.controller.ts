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
import { FeatureService } from '../service/feature.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
import { Public } from '../../../../core/jwt/public.decorator';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { JwtAuthGuard } from 'src/core/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';

@ApiTags('Feature')
@Controller('feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new feature (Admin only)' })
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    const data = await this.featureService.create(createFeatureDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Feature created successfully',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all features' })
  async findAll() {
    const data = await this.featureService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Features retrieved successfully',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get feature by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.featureService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Feature retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a feature (Admin only)' })
  async update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    const data = await this.featureService.update(id, updateFeatureDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Feature updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a feature (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.featureService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Feature deleted successfully',
    };
  }
}
