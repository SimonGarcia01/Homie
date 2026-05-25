import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { ChecklistItemStatus } from '../../common/enums';

import { DocumentsService } from './documents.service';

type RequestWithUser = { user: { id: string; organizationId: string } };

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
    constructor(private readonly service: DocumentsService) {}

    @Get()
    findAll(@Query('propertyId') propertyId?: string, @Query('leadId') leadId?: string) {
        return this.service.findAll({ propertyId, leadId });
    }

    @Get('stats')
    stats() {
        return this.service.getStats();
    }

    @Get('types')
    types() {
        return this.service.listDocumentTypes();
    }

    @Post('upload')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @Req() req: RequestWithUser,
        @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        @Body('propertyId') propertyId?: string,
        @Body('leadId') leadId?: string,
        @Body('ownerId') ownerId?: string,
        @Body('kind') kind?: string,
    ) {
        return this.service.upload(req.user.id, file, { propertyId, leadId, ownerId, kind });
    }

    @Get(':id/download')
    async download(@Param('id') id: string, @Res() res: Response) {
        const { stream, filename } = await this.service.getDownloadStream(id);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        stream.pipe(res);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: ChecklistItemStatus) {
        return this.service.updateStatus(id, status);
    }
}
