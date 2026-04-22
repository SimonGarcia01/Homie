import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {}
