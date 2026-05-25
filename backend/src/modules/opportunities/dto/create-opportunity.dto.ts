import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LinkOpportunityPropertyDto {
    @ApiProperty()
    @IsUUID()
    propertyId!: string;
}

export class CreateOpportunityDto {
    @ApiProperty()
    @IsUUID()
    leadId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    propertyId?: string;

    @ApiPropertyOptional({ description: 'Stage key: visita, aplicacion, etc.' })
    @IsOptional()
    @IsString()
    stageKey?: string;
}
