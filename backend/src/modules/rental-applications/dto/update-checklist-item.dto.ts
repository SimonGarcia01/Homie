import { IsEnum } from 'class-validator';

import { ChecklistItemStatus } from '../../../common/enums';

export class UpdateChecklistItemDto {
    @IsEnum(ChecklistItemStatus)
    status!: ChecklistItemStatus;
}
