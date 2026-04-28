import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum, IsNumber, IsNotEmpty, IsUrl, Min, Max } from 'class-validator';
import { ContentStatus } from 'prisma/generated/prisma/enums';

export class CreateBookDto {
  @ApiProperty({ example: 'Physics Vol 1', description: 'The title of the book' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'The cover image URL' })
  @IsUrl()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 'PHY-001', description: 'Unique identifier for the book' })
  @IsString()
  @IsNotEmpty()
  customId!: string;

  @ApiProperty({ example: '2024', description: 'The year of publication' })
  @IsString()
  @IsNotEmpty()
  year!: string;

  @ApiPropertyOptional({ example: ['Science', 'HSC'], type: [String], description: 'Tags for categorization' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 1.0, description: 'Negative marking for this book' })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  negativeMark?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.TEST, description: 'Visibility status of the book' })
  @IsEnum(ContentStatus)
  @IsOptional()
  isVisible?: ContentStatus;
}
