import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, MinLength, IsString } from 'class-validator';

export class CreateDeveloperDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({ example: 'Alice' })
  @IsNotEmpty()
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Developer', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'gh-username', required: false })
  @IsOptional()
  @IsString()
  githubId?: string;
}
