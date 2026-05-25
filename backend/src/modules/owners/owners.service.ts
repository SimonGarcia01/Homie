import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { OwnerType } from '../../common/enums';
import { ContactsService } from '../contacts/contacts.service';

import { CreateOwnerDto } from './dto/create-owner.dto';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { Owner } from './entities/owner.entity';

export type OwnerOptionView = {
    id: string;
    contactId: string;
    label: string;
    email: string | null;
    phone: string | null;
};

export type OwnerDetailView = OwnerOptionView & {
    ownerType: OwnerType;
    firstName: string;
    lastName: string;
};

@Injectable()
export class OwnersService {
    constructor(
        @InjectRepository(Owner)
        private readonly repository: Repository<Owner>,
        private readonly contactsService: ContactsService,
    ) {}

    private toView(owner: Owner): OwnerDetailView {
        const firstName = owner.contact?.firstName ?? '';
        const lastName = owner.contact?.lastName ?? '';
        return {
            id: owner.id,
            contactId: owner.contactId,
            label: `${firstName} ${lastName}`.trim() || owner.id,
            email: owner.contact?.email ?? null,
            phone: owner.contact?.phone ?? null,
            ownerType: owner.ownerType,
            firstName,
            lastName,
        };
    }

    async findOptionsForOrganization(organizationId: string): Promise<OwnerOptionView[]> {
        const rows = await this.repository.find({
            where: { organizationId },
            relations: ['contact'],
            order: { createdAt: 'DESC' },
        });
        return rows.map((owner) => {
            const view = this.toView(owner);
            return { id: view.id, contactId: view.contactId, label: view.label, email: view.email, phone: view.phone };
        });
    }

    async findAll(organizationId: string) {
        const rows = await this.repository.find({
            where: { organizationId },
            relations: ['contact'],
            order: { createdAt: 'DESC' },
        });
        return rows.map((owner) => this.toView(owner));
    }

    async findOne(organizationId: string, id: string) {
        const owner = await this.repository.findOne({
            where: { id, organizationId },
            relations: ['contact'],
        });
        if (!owner) throw new NotFoundException('Owner not found');
        return this.toView(owner);
    }

    async search(organizationId: string, query: string) {
        const trimmed = query.trim();
        if (!trimmed) return [];

        const q = `%${trimmed}%`;
        const rows = await this.repository
            .createQueryBuilder('owner')
            .leftJoinAndSelect('owner.contact', 'contact')
            .where('owner.organization_id = :organizationId', { organizationId })
            .andWhere(
                `(contact.first_name ILIKE :q OR contact.last_name ILIKE :q OR CONCAT(contact.first_name, ' ', contact.last_name) ILIKE :q OR contact.email ILIKE :q)`,
                { q },
            )
            .orderBy('owner.createdAt', 'DESC')
            .take(10)
            .getMany();

        return rows.map((owner) => this.toView(owner));
    }

    async create(organizationId: string, dto: CreateOwnerDto) {
        const contact = await this.contactsService.create(organizationId, {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            phone: dto.phone,
        });
        const owner = this.repository.create({
            organizationId,
            contactId: contact.id,
            ownerType: dto.ownerType ?? OwnerType.PERSON,
        });
        const saved = await this.repository.save(owner);
        return this.findOne(organizationId, saved.id);
    }

    async update(organizationId: string, id: string, dto: UpdateOwnerDto) {
        const owner = await this.repository.findOne({
            where: { id, organizationId },
            relations: ['contact'],
        });
        if (!owner) throw new NotFoundException('Owner not found');
        if (owner.contact) {
            await this.contactsService.update(organizationId, owner.contactId, {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
            });
        }
        if (dto.ownerType !== undefined) owner.ownerType = dto.ownerType;
        await this.repository.save(owner);
        return this.findOne(organizationId, id);
    }

    async remove(organizationId: string, id: string) {
        const owner = await this.repository.findOne({ where: { id, organizationId } });
        if (!owner) throw new NotFoundException('Owner not found');
        await this.repository.remove(owner);
        return { id };
    }
}
