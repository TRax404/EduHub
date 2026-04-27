import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BadgeEventType, BadgeRarity } from 'prisma/generated/prisma/enums';

export class BadgeRuleDto {
  @ApiProperty({ enum: BadgeEventType })
  @IsEnum(BadgeEventType)
  eventType!: BadgeEventType;

  @ApiProperty({ example: { minScore: 90 } })
  @IsNotEmpty()
  condition: any;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBadgeDto {
  @ApiProperty({ example: 'Quiz Master' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Awarded for completing 10 quizzes with high scores' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png' })
  @IsOptional()
  @IsUrl()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ enum: BadgeRarity, default: BadgeRarity.BRONZE })
  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  diamondReward?: number;

  @ApiPropertyOptional({ type: [BadgeRuleDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BadgeRuleDto)
  rules?: BadgeRuleDto[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBadgeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({ enum: BadgeRarity })
  @IsOptional()
  @IsEnum(BadgeRarity)
  rarity?: BadgeRarity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  diamondReward?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
