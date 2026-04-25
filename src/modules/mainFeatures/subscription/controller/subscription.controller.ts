import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../service/subscription.service';
import { CreateStudentSubscriptionDto, AdminGrantDto } from '../dto/student-subscription.dto';
import { GetUser } from '../../../../core/jwt/get-user.decorator';
import { Roles } from '../../../../core/jwt/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { JwtAuthGuard } from 'src/core/jwt/jwt-auth.guard';
import { RolesGuard } from 'src/core/jwt/roles.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('subscribe')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Subscribe to a plan (Student only)' })
  async subscribe(@GetUser('sub') studentId: string, @Body() dto: CreateStudentSubscriptionDto) {
    const data = await this.subscriptionService.subscribe(studentId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Subscribed successfully',
      data,
    };
  }

  @Get('my-subscriptions')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current student subscriptions' })
  async findMySubscriptions(@GetUser('sub') studentId: string) {
    const data = await this.subscriptionService.getStudentSubscriptions(studentId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscriptions retrieved successfully',
      data,
    };
  }

  @Post('grant')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Grant access to a student (Admin only)' })
  async grantAccess(@GetUser('sub') adminId: string, @Body() dto: AdminGrantDto) {
    const data = await this.subscriptionService.grantAccess(adminId, dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Access granted successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Cancel a subscription (Admin only)' })
  async cancel(@Param('id') id: string) {
    await this.subscriptionService.cancelSubscription(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Subscription cancelled successfully',
    };
  }
}
