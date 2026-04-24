import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsString, IsArray } from 'class-validator';

export class CreateMakerDto {
  @ApiProperty({ example: 'maker@example.com' })
  @IsEmail()
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Quiz Master' })
  @IsNotEmpty()
  @IsString()
  displayName!: string;

  @ApiProperty({ example: 'Expert in Physics and Math', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: ['Physics', 'Math'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];
}
