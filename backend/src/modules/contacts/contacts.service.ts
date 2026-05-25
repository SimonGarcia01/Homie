import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactsService {
    constructor(
        @InjectRepository(Contact)
        private readonly repository: Repository<Contact>,
    ) {}

    async findAll(organizationId: string, q?: string) {
        if (q?.trim()) {
            const term = `%${q.trim()}%`;
            return this.repository.find({
                where: [
                    { organizationId, firstName: ILike(term) },
                    { organizationId, lastName: ILike(term) },
                    { organizationId, email: ILike(term) },
                ],
                order: { createdAt: 'DESC' },
            });
        }
        return this.repository.find({ where: { organizationId }, order: { createdAt: 'DESC' } });
    }

    async findOne(organizationId: string, id: string) {
        const contact = await this.repository.findOne({ where: { id, organizationId } });
        if (!contact) throw new NotFoundException('Contact not found');
        return contact;
    }

    async create(organizationId: string, dto: CreateContactDto) {
        const contact = this.repository.create({
            organizationId,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email?.trim(),
            phone: dto.phone?.trim(),
        });
        return this.repository.save(contact);
    }

    async update(organizationId: string, id: string, dto: UpdateContactDto) {
        const contact = await this.findOne(organizationId, id);
        if (dto.firstName !== undefined) contact.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined) contact.lastName = dto.lastName.trim();
        if (dto.email !== undefined) contact.email = dto.email?.trim();
        if (dto.phone !== undefined) contact.phone = dto.phone?.trim();
        return this.repository.save(contact);
    }
}
