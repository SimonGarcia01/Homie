import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';

type RequestWithOrg = { user: { organizationId: string } };

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
    constructor(private readonly service: ContactsService) {}

    @Get()
    findAll(@Req() req: RequestWithOrg, @Query('q') q?: string) {
        return this.service.findAll(req.user.organizationId, q);
    }

    @Get(':id')
    findOne(@Req() req: RequestWithOrg, @Param('id') id: string) {
        return this.service.findOne(req.user.organizationId, id);
    }

    @Post()
    create(@Req() req: RequestWithOrg, @Body() dto: CreateContactDto) {
        return this.service.create(req.user.organizationId, dto);
    }

    @Patch(':id')
    update(@Req() req: RequestWithOrg, @Param('id') id: string, @Body() dto: UpdateContactDto) {
        return this.service.update(req.user.organizationId, id, dto);
    }
}
