import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'device-uuid-123',
    description:
      'Device identifier to logout. If omitted, uses deviceId from access token.',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

