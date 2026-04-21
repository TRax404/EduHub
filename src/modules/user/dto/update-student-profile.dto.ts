import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ClassLevel, Group } from 'prisma/generated/prisma/enums';

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Dhaka University' })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiPropertyOptional({ example: 'I am a student' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ enum: ClassLevel })
  @IsOptional()
  @IsEnum(ClassLevel)
  classLevel?: ClassLevel;

  @ApiPropertyOptional({ enum: Group })
  @IsOptional()
  @IsEnum(Group)
  studentGroup?: Group;

  @ApiPropertyOptional({ example: 'BUET' })
  @IsOptional()
  @IsString()
  targetExam?: string;
}
