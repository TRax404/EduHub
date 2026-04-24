import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AdminFilterRole {
  ADMIN = 'ADMIN',
  SUPPORTER = 'SUPPORTER',
  QUIZZER = 'QUIZZER',
  DEVELOPER = 'DEVELOPER',
}


export class FilterAdministratorDto {
  @ApiPropertyOptional({ enum: AdminFilterRole })
  @IsOptional()
  @IsEnum(AdminFilterRole)
  role?: AdminFilterRole;

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;
}

