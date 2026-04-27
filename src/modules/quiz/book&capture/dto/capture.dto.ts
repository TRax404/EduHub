import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CaptureImageDto {
  @ApiProperty({ example: 'clw... (cuid)' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiPropertyOptional({ example: 'uuid-of-chapter' })
  @IsUUID()
  @IsOptional()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'Physics Lecture Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

