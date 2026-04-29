import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Owner } from './entities/owner.entity';

export type OwnerOptionView = {
    id: string;
    contactId: string;
    label: string;
    email: string | null;
};

@Injectable()
export class OwnersService {
    constructor(
        @InjectRepository(Owner)
        private readonly repository: Repository<Owner>,
    ) {}

    async findOptionsForOrganization(organizationId: string): Promise<OwnerOptionView[]> {
        const rows = await this.repository.find({
            where: { organizationId },
            relations: ['contact'],
            order: { createdAt: 'DESC' },
        });

        return rows.map((owner) => ({
            id: owner.id,
            contactId: owner.contactId,
            label: owner.contact ? `${owner.contact.firstName} ${owner.contact.lastName}`.trim() : owner.id,
            email: owner.contact?.email ?? null,
        }));
    }
}
