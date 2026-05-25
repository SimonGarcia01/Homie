import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { OwnersService } from './owners.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
export class OwnersController {
    constructor(private readonly service: OwnersService) {}

    @Get()
    findOptions(@Req() req: RequestWithOrg) {
        return this.service.findOptionsForOrganization(req.user.organizationId);
    }

    @Get('list')
    findAll(@Req() req: RequestWithOrg) {
        return this.service.findAll(req.user.organizationId);
    }

    @Get(':id')
    findOne(@Req() req: RequestWithOrg, @Param('id') id: string) {
        return this.service.findOne(req.user.organizationId, id);
    }

    @Post()
    create(@Req() req: RequestWithOrg, @Body() dto: CreateOwnerDto) {
        return this.service.create(req.user.organizationId, dto);
    }

    @Patch(':id')
    update(@Req() req: RequestWithOrg, @Param('id') id: string, @Body() dto: UpdateOwnerDto) {
        return this.service.update(req.user.organizationId, id, dto);
    }

    @Delete(':id')
    remove(@Req() req: RequestWithOrg, @Param('id') id: string) {
        return this.service.remove(req.user.organizationId, id);
    }
}
