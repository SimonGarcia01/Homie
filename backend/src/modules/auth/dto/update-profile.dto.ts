import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Current password required when changing password' })
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiPropertyOptional({ minLength: 8 })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;
}
