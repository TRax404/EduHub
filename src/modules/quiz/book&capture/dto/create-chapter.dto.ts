import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ContentStatus } from 'prisma/generated/prisma/enums';

export class CreateChapterDto {
  @ApiProperty({ example: 'Introduction to Physics' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  order!: number;

  @ApiProperty({ example: '2024' })
  @IsString()
  @IsNotEmpty()
  year!: string;

  @ApiProperty({ example: 'book-cuid-here' })
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @ApiPropertyOptional({ example: ['mechanics', 'basics'] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.TEST })
  @IsOptional()
  @IsEnum(ContentStatus)
  isVisible?: ContentStatus;
}
