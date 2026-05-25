import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateActivityDto } from './dto/create-activity.dto';
import { Activity } from './entities/activity.entity';

export type ActivityView = {
    id: string;
    type: string;
    message: string;
    userId: string;
    entityId?: string;
    entityLabel?: string;
    date: string;
};

const TYPE_UI: Record<string, string> = {
    call: 'lead',
    note: 'lead',
    whatsapp: 'lead',
    email: 'lead',
    stage_change: 'oportunidad',
    visit: 'visita',
    document_received: 'documento',
};

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(Activity)
        private readonly repository: Repository<Activity>,
    ) {}

    async create(organizationId: string, userId: string, dto: CreateActivityDto) {
        const activity = this.repository.create({
            organizationId,
            userId,
            type: dto.type,
            content: dto.content,
            contactId: dto.contactId,
            leadId: dto.leadId,
            opportunityId: dto.opportunityId,
            propertyId: dto.propertyId,
            visitId: dto.visitId,
        });
        return this.repository.save(activity);
    }

    async findRecent(organizationId: string, limit = 8) {
        const rows = await this.repository.find({
            where: { organizationId },
            relations: { user: true, contact: true, property: true },
            order: { createdAt: 'DESC' },
            take: limit,
        });

        return rows.map((a) => ({
            id: a.id,
            type: TYPE_UI[a.type] ?? 'lead',
            message: a.content ?? a.type,
            userId: a.userId,
            entityId: a.leadId ?? a.opportunityId ?? a.propertyId ?? a.visitId,
            entityLabel: a.contact
                ? `${a.contact.firstName} ${a.contact.lastName}`.trim()
                : a.property?.title,
            date: a.createdAt.toISOString(),
        })) satisfies ActivityView[];
    }
}
