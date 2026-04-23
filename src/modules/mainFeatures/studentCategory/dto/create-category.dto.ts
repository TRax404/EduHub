import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CategoryType {
  ACADEMIC = 'ACADEMIC',
  ADMISSION = 'ADMISSION',
  JOB_PREP = 'JOB_PREP',
  SKILLS = 'SKILLS',
}

export enum ContentStatus {
  TEST = 'TEST',
  BETA = 'BETA',
  PUBLISH = 'PUBLISH',
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.TEST })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  diamondUnlockCost?: number;
}
