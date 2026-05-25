import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from './entities/organization.entity';

function slugify(value: string): string {
    return (
        value
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{M}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 100) || 'org'
    );
}

@Injectable()
export class OrganizationsService {
    constructor(
        @InjectRepository(Organization)
        private readonly repository: Repository<Organization>,
    ) {}

    async create(input: { name: string; country?: string }) {
        const baseSlug = slugify(input.name);
        let slug = baseSlug;
        let attempt = 0;

        while (await this.repository.exist({ where: { slug } })) {
            attempt += 1;
            slug = `${baseSlug}-${attempt}`;
        }

        const organization = this.repository.create({
            name: input.name.trim(),
            slug,
            country: input.country?.trim() || 'Chile',
            timezone: 'America/Santiago',
            isActive: true,
        });

        return this.repository.save(organization);
    }
}
