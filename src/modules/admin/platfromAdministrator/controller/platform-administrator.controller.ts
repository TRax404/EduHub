import { Controller, Post, Body, UseGuards, HttpStatus, Get, Query, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from 'prisma/generated/prisma/enums';
import { Roles } from 'src/core/jwt/roles.decorator';
import { RolesGuard } from 'src/core/jwt/roles.guard';
import { PlatformAdministratorService } from '../services/platform-administrator.service';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { CreateSupporterDto } from '../dto/create-supporter.dto';
import { CreateMakerDto } from '../dto/create-maker.dto';
import { CreateDeveloperDto } from '../dto/create-developer.dto';
import { FilterAdministratorDto } from '../dto/filter-administrator.dto';
import { UpdateRoleStatusDto } from '../dto/update-role-status.dto';

@ApiTags('Platform Administrator')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('platform-administrator')
export class PlatformAdministratorController {
  constructor(private readonly adminService: PlatformAdministratorService) { }

  @Post('create-admin')
  @ApiOperation({ summary: 'Create a new admin user (SuperAdmin only)' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    const result = await this.adminService.createAdmin(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Administrator account created successfully',
      data: result,
    };
  }

  @Post('create-supporter')
  @ApiOperation({ summary: 'Create a new supporter user (SuperAdmin only)' })
  async createSupporter(@Body() dto: CreateSupporterDto) {
    const result = await this.adminService.createSupporter(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Supporter account created successfully',
      data: result,
    };
  }

  @Post('create-maker')
  @ApiOperation({ summary: 'Create a new maker user (SuperAdmin only)' })
  async createMaker(@Body() dto: CreateMakerDto) {
    const result = await this.adminService.createMaker(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Maker account created successfully',
      data: result,
    };
  }

  @Post('create-developer')
  @ApiOperation({ summary: 'Create a new developer user (SuperAdmin only)' })
  async createDeveloper(@Body() dto: CreateDeveloperDto) {
    const result = await this.adminService.createDeveloper(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Developer account created successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all administrators (SuperAdmin only)', description: 'Returns admins, supporters, makers and developers. Can filter by role and search by email or name.' })
  async getAllAdministrators(@Query() filter: FilterAdministratorDto) {
    const result = await this.adminService.findAllAdministrators(filter);
    return {
      statusCode: HttpStatus.OK,
      message: 'Administrators retrieved successfully',
      data: result,
    };
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Update administrator status (SuperAdmin only)' })
  async updateStatus(
    @Param('userId') userId: string,
    @Body() dto: UpdateRoleStatusDto
  ) {
    const result = await this.adminService.updateAdministratorStatus(userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Administrator status updated successfully',
      data: result,
    };
  }
}
