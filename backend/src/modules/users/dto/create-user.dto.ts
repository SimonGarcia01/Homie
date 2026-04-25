import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @IsUUID()
    organizationId!: string;

    @ApiProperty()
    @IsUUID()
    roleId!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiProperty()
    @IsString()
    firstName!: string;

    @ApiProperty()
    @IsString()
    lastName!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
