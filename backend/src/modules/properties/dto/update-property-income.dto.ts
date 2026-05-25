import { PartialType } from '@nestjs/swagger';

import { CreatePropertyIncomeDto } from './create-property-income.dto';

export class UpdatePropertyIncomeDto extends PartialType(CreatePropertyIncomeDto) {}
