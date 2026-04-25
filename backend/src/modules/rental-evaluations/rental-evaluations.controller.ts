import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('rental-evaluations')
@ApiBearerAuth()
@Controller('rental-evaluations')
export class RentalEvaluationsController {}
