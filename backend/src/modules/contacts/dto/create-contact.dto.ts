import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
    @ApiProperty()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @ApiProperty()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
}
