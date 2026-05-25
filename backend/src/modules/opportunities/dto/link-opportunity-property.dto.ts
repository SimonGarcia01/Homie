import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkOpportunityPropertyDto {
    @ApiProperty()
    @IsUUID()
    propertyId!: string;
}
