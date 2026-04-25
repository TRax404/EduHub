import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsInt, IsOptional, IsEnum } from 'class-validator';
import { PlanTier } from 'prisma/generated/prisma/enums';

export class CreateStudentSubscriptionDto {
  @ApiProperty({ example: 'plan-id' })
  @IsString()
  planId!: string;

  @ApiProperty({ example: ['category-id-1', 'category-id-2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  categoryIds!: string[];

  @ApiProperty({ example: 2024 })
  @IsInt()
  academicYear!: number;
}

export class AdminGrantDto {
  @ApiProperty({ example: 'student-id' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 'category-id', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'feature-id', required: false })
  @IsString()
  @IsOptional()
  featureId?: string;

  @ApiProperty({ enum: PlanTier, required: false })
  @IsEnum(PlanTier)
  @IsOptional()
  planTier?: PlanTier;

  @ApiProperty({ example: 'Scholarship reward' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  expiresAt?: string;
}
