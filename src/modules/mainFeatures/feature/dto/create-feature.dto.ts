import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValueType, ContentStatus } from '@prisma/client';

export class CreateFeatureDto {
  @ApiProperty({ description: 'Unique identifier name (e.g., BOOK_QUIZ)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Display label for students' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ValueType })
  @IsEnum(ValueType)
  valueType: ValueType;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.TEST })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  diamondUnlockCost?: number;
}
