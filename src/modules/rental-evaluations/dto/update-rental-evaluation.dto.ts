import { PartialType } from '@nestjs/swagger';

import { CreateRentalEvaluationDto } from './create-rental-evaluation.dto';

export class UpdateRentalEvaluationDto extends PartialType(
  CreateRentalEvaluationDto,
) {}
