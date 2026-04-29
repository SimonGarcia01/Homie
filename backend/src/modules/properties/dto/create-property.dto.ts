import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { PropertyCommercialStatus, PropertyPublicationStatus, PropertyType } from '../../../common/enums';

export class CreatePropertyDto {
    @ApiProperty()
    @IsUUID()
    ownerId!: string;

    @ApiProperty({ example: 'HOM-001', maxLength: 50 })
    @IsString()
    @MaxLength(50)
    code!: string;

    @ApiProperty({ example: 'Apartamento norte', maxLength: 180 })
    @IsString()
    @MaxLength(180)
    title!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ enum: PropertyType })
    @IsEnum(PropertyType)
    propertyType!: PropertyType;

    @ApiPropertyOptional({ enum: PropertyCommercialStatus, default: PropertyCommercialStatus.AVAILABLE })
    @IsOptional()
    @IsEnum(PropertyCommercialStatus)
    commercialStatus?: PropertyCommercialStatus;

    @ApiPropertyOptional({ enum: PropertyPublicationStatus, default: PropertyPublicationStatus.DRAFT })
    @IsOptional()
    @IsEnum(PropertyPublicationStatus)
    publicationStatus?: PropertyPublicationStatus;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVisible?: boolean;
}
