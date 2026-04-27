import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { ContentStatus } from 'prisma/generated/prisma/enums';

export class CreateBookDto {
  @ApiProperty({ example: 'Physics Vol 1' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'PHY-001' })
  @IsString()
  @IsNotEmpty()
  customId!: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  year!: string;

  @ApiPropertyOptional({ example: ['Science', 'HSC'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 1.0 })
  @IsNumber()
  @IsOptional()
  negativeMark?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.TEST })
  @IsEnum(ContentStatus)
  @IsOptional()
  isVisible?: ContentStatus;
}
