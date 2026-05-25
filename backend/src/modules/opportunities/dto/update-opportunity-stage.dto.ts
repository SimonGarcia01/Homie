import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateOpportunityStageDto {
    @ApiProperty({ description: 'Stage key: nuevo, contactado, visita, aplicacion, ganado, perdido' })
    @IsString()
    stageKey!: string;
}
