import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../../../core/jwt/get-user.decorator';
import { UserService } from '../service/user.service';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@GetUser('id') userId: string) {
    return this.userService.getMe(userId);
  }

  @Patch('profile/student')
  @ApiOperation({ summary: 'Update student profile' })
  updateStudentProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.userService.updateStudentProfile(userId, dto);
  }
}
