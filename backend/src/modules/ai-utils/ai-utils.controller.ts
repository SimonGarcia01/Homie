import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AiUtilsService } from './ai-utils.service';

@ApiTags('AI Utils')
@ApiBearerAuth()
@Controller('ai')
export class AiUtilsController {
    constructor(private readonly service: AiUtilsService) {}

    @Post('property-description')
    generatePropertyDescription(
        @Body()
        dto: {
            title: string;
            type: string;
            city: string;
            bedrooms: number;
            bathrooms: number;
            rent: number;
            currency: string;
        },
    ) {
        return this.service.generatePropertyDescription(dto);
    }

    @Post('smart-reply')
    generateSmartReply(@Body() dto: { leadId: string }, @Request() req: { user: { organizationId: string } }) {
        return this.service.generateSmartReply(dto.leadId, req.user.organizationId);
    }

    @Post('classify-document')
    classifyDocument(@Body() dto: { filename: string; mimeType?: string }) {
        return this.service.classifyDocument(dto.filename, dto.mimeType);
    }

    @Post('lead-scores')
    batchLeadScores(@Body() dto: { leadIds: string[] }, @Request() req: { user: { organizationId: string } }) {
        return this.service.batchLeadScores(dto.leadIds, req.user.organizationId);
    }

    @Get('rent-suggestion')
    getRentSuggestion(
        @Query('tipo') tipo: string,
        @Query('ciudad') ciudad: string,
        @Query('dormitorios') dormitorios: string | undefined,
        @Query('banos') banos: string | undefined,
        @Request() req: { user: { organizationId: string } },
    ) {
        return this.service.getRentSuggestion({
            tipo,
            ciudad,
            dormitorios: dormitorios !== undefined ? Number(dormitorios) : undefined,
            banos: banos !== undefined ? Number(banos) : undefined,
            organizationId: req.user.organizationId,
        });
    }

    @Get('weekly-digest')
    getWeeklyDigest(@Query('force') force: string | undefined, @Request() req: { user: { organizationId: string } }) {
        return this.service.getWeeklyDigest(req.user.organizationId, force === 'true');
    }

    @Get('visit-brief/:visitId')
    getVisitBrief(@Param('visitId') visitId: string, @Request() req: { user: { organizationId: string } }) {
        return this.service.getVisitBrief(visitId, req.user.organizationId);
    }
}
