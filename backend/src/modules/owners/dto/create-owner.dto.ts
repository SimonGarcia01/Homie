import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { OwnerType } from '../../../common/enums';

export class CreateOwnerDto {
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

    @ApiPropertyOptional({ enum: OwnerType, default: OwnerType.PERSON })
    @IsOptional()
    @IsEnum(OwnerType)
    ownerType?: OwnerType;
}
