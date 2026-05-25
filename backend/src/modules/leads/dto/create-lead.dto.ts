import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { LeadStatus, LeadTemperature } from '../../../common/enums';

export class CreateLeadDto {
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

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    propertyId?: string;

    @ApiPropertyOptional({ default: 'web' })
    @IsOptional()
    @IsString()
    source?: string;
}

export class UpdateLeadDto {
    @ApiPropertyOptional({ enum: LeadStatus })
    @IsOptional()
    @IsEnum(LeadStatus)
    status?: LeadStatus;

    @ApiPropertyOptional({ enum: LeadTemperature })
    @IsOptional()
    @IsEnum(LeadTemperature)
    temperature?: LeadTemperature;
}

export class ConvertLeadDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    propertyId?: string;

    @ApiPropertyOptional({ default: 'visita' })
    @IsOptional()
    @IsString()
    stageKey?: string;
}
