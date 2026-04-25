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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionPlanService } from '../service/subscription-plan.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';
import { Public } from '../../../../core/jwt/public.decorator';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { JwtAuthGuard } from 'src/core/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';

@ApiTags('Subscription Plan')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(private readonly planService: SubscriptionPlanService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  async create(@Body() dto: CreateSubscriptionPlanDto) {
    const data = await this.planService.create(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Subscription plan created successfully',
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  async findAll() {
    const data = await this.planService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription plans retrieved successfully',
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.planService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription plan retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Update a subscription plan (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    const data = await this.planService.update(id, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription plan updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Delete a subscription plan (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.planService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription plan deleted successfully',
    };
  }
}
