import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsInt, Min } from 'class-validator';
import { PlanTier } from 'prisma/generated/prisma/enums';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Premium Plan' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Full access to all features', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 365 })
  @IsInt()
  @Min(1)
  durationDays!: number;

  @ApiProperty({ enum: PlanTier, default: PlanTier.FREE })
  @IsEnum(PlanTier)
  tier!: PlanTier;

  @ApiProperty({ enum: PlanTier, required: false })
  @IsEnum(PlanTier)
  @IsOptional()
  upgradeFromTier?: PlanTier;
}

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) { }
