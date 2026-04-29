import { PartialType } from '@nestjs/swagger';

import { CreatePropertyExpenseDto } from './create-property-expense.dto';

export class UpdatePropertyExpenseDto extends PartialType(CreatePropertyExpenseDto) {}
