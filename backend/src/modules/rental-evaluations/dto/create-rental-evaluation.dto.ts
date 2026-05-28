import { IsEnum, IsOptional, IsString } from 'class-validator';

import { EvaluationRecommendation } from '../../../common/enums';

export class CreateRentalEvaluationDto {
    @IsEnum(EvaluationRecommendation)
    recommendation!: EvaluationRecommendation;

    @IsOptional()
    @IsString()
    notes?: string;
}
