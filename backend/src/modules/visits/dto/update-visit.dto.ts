import { PartialType } from '@nestjs/swagger';

import { CreateVisitDto } from './create-visit.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VisitStatus } from '../../../common/enums';

export class UpdateVisitDto extends PartialType(CreateVisitDto) {
    @ApiPropertyOptional({ enum: VisitStatus })
    @IsOptional()
    @IsEnum(VisitStatus)
    status?: VisitStatus;
}
