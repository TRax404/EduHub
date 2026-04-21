import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'johndeo',
    description: 'Name',
  })
  @IsNotEmpty()
  name!: string;
  @ApiProperty({
    example: 'john@gmail.com',
    description: 'Valid email address',
  })
  @IsEmail()
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email!: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'Password (min 6 characters)',
  })
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    example: 'device-uuid-123',
    description: 'Unique device identifier',
  })
  @IsNotEmpty()
  deviceId!: string;
}
