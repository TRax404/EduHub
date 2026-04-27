import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgeService } from '../service/badge.service';
import { CreateBadgeDto, UpdateBadgeDto, BadgeRuleDto } from '../dto/badge.dto';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { JwtAuthGuard } from 'src/core/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';

@ApiTags('Badge')
@ApiBearerAuth()
@Controller('badge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Create a new badge with rules (Admin only)' })
  async create(@Body() createBadgeDto: CreateBadgeDto) {
    const data = await this.badgeService.create(createBadgeDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Badge created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all badges' })
  async findAll() {
    const data = await this.badgeService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Badges retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get badge by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.badgeService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Badge retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a badge (Admin only)' })
  async update(@Param('id') id: string, @Body() updateBadgeDto: UpdateBadgeDto) {
    const data = await this.badgeService.update(id, updateBadgeDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Badge updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a badge (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.badgeService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Badge deleted successfully',
    };
  }

  @Post(':id/rules')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Add a rule to a badge (Admin only)' })
  async addRule(@Param('id') id: string, @Body() ruleDto: BadgeRuleDto) {
    const data = await this.badgeService.addRule(id, ruleDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Rule added successfully',
      data,
    };
  }

  @Patch('rules/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a badge rule (Admin only)' })
  async updateRule(@Param('ruleId') ruleId: string, @Body() ruleDto: Partial<BadgeRuleDto>) {
    const data = await this.badgeService.updateRule(ruleId, ruleDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Rule updated successfully',
      data,
    };
  }

  @Delete('rules/:ruleId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a badge rule (Admin only)' })
  async removeRule(@Param('ruleId') ruleId: string) {
    await this.badgeService.removeRule(ruleId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Rule deleted successfully',
    };
  }
}
