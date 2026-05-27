import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ProspectRegisterDto {
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

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    phone?: string;
}

export class ProspectLoginDto {
    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    @MinLength(1)
    password!: string;
}
