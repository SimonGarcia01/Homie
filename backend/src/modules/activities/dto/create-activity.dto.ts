import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { ActivityType } from '../../../common/enums';

export class CreateActivityDto {
    @ApiProperty({ enum: ActivityType })
    @IsEnum(ActivityType)
    type!: ActivityType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    contactId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    leadId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    opportunityId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    propertyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    visitId?: string;
}
