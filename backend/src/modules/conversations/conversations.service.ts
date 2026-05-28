import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityType, MessageChannel } from '../../common/enums';
import { ActivitiesService } from '../activities/activities.service';
import { Lead } from '../leads/entities/lead.entity';
import { LeadsService } from '../leads/leads.service';

import { CreateConversationMessageDto } from './dto/create-conversation-message.dto';
import { ConversationMessage } from './entities/conversation-message.entity';

export type ConversationMessageView = {
    id: string;
    leadId: string;
    opportunityId?: string;
    channel: string;
    direction: string;
    body: string;
    userId: string;
    userName: string;
    createdAt: string;
};

export type InboxThreadView = {
    leadId: string;
    contactName: string;
    email: string;
    phone: string;
    stage: string;
    propertyId?: string;
    propertyTitle?: string;
    lastMessage: string;
    lastChannel: string;
    lastDirection: string;
    lastMessageAt: string;
    messageCount: number;
};

const CHANNEL_ACTIVITY: Record<MessageChannel, ActivityType> = {
    [MessageChannel.WHATSAPP]: ActivityType.WHATSAPP,
    [MessageChannel.CALL]: ActivityType.CALL,
    [MessageChannel.EMAIL]: ActivityType.EMAIL,
    [MessageChannel.SMS]: ActivityType.NOTE,
    [MessageChannel.NOTE]: ActivityType.NOTE,
    [MessageChannel.OTHER]: ActivityType.NOTE,
};

const CHANNEL_LABEL: Record<MessageChannel, string> = {
    [MessageChannel.WHATSAPP]: 'WhatsApp',
    [MessageChannel.CALL]: 'Llamada',
    [MessageChannel.EMAIL]: 'Email',
    [MessageChannel.SMS]: 'SMS',
    [MessageChannel.NOTE]: 'Nota',
    [MessageChannel.OTHER]: 'Otro',
};

const DIRECTION_LABEL = {
    inbound: 'entrante',
    outbound: 'saliente',
};

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(ConversationMessage)
        private readonly messagesRepo: Repository<ConversationMessage>,
        @InjectRepository(Lead)
        private readonly leadsRepo: Repository<Lead>,
        private readonly leadsService: LeadsService,
        private readonly activitiesService: ActivitiesService,
    ) {}

    async listThreads(organizationId: string, limit = 30): Promise<InboxThreadView[]> {
        const messages = await this.messagesRepo.find({
            where: { organizationId },
            relations: { user: true, lead: { contact: true } },
            order: { createdAt: 'DESC' },
            take: 200,
        });

        const grouped = new Map<string, ConversationMessage[]>();
        for (const message of messages) {
            const bucket = grouped.get(message.leadId) ?? [];
            bucket.push(message);
            grouped.set(message.leadId, bucket);
        }

        const threads: InboxThreadView[] = [];
        for (const [leadId, leadMessages] of grouped) {
            const latest = leadMessages[0];
            const leadView = await this.leadsService.findOne(organizationId, leadId).catch(() => null);
            if (!leadView) continue;

            threads.push({
                leadId,
                contactName: leadView.name,
                email: leadView.email,
                phone: leadView.phone,
                stage: leadView.stage,
                propertyId: leadView.propertyId,
                propertyTitle: leadView.propertyTitle,
                lastMessage: latest.body,
                lastChannel: latest.channel,
                lastDirection: latest.direction,
                lastMessageAt: latest.createdAt.toISOString(),
                messageCount: leadMessages.length,
            });
        }

        return threads
            .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
            .slice(0, limit);
    }

    async listForLead(organizationId: string, leadId: string, limit = 100): Promise<ConversationMessageView[]> {
        await this.ensureLeadAccess(organizationId, leadId);

        const rows = await this.messagesRepo.find({
            where: { organizationId, leadId },
            relations: { user: true },
            order: { createdAt: 'ASC' },
            take: limit,
        });

        return rows.map((row) => this.toView(row));
    }

    async create(
        organizationId: string,
        userId: string,
        leadId: string,
        dto: CreateConversationMessageDto,
    ): Promise<ConversationMessageView> {
        const lead = await this.ensureLeadAccess(organizationId, leadId);
        const leadView = await this.leadsService.findOne(organizationId, leadId);

        const entity = this.messagesRepo.create({
            organizationId,
            leadId,
            opportunityId: dto.opportunityId,
            userId,
            channel: dto.channel,
            direction: dto.direction,
            body: dto.body.trim(),
        });
        const saved = await this.messagesRepo.save(entity);

        const channelLabel = CHANNEL_LABEL[dto.channel];
        const directionLabel = DIRECTION_LABEL[dto.direction];
        await this.activitiesService.create(organizationId, userId, {
            type: CHANNEL_ACTIVITY[dto.channel],
            content: `${channelLabel} (${directionLabel}): ${dto.body.trim().slice(0, 240)}`,
            leadId,
            contactId: lead.contactId,
            opportunityId: dto.opportunityId,
            propertyId: leadView.propertyId,
        });

        const full = await this.messagesRepo.findOne({
            where: { id: saved.id },
            relations: { user: true },
        });

        return this.toView(full!);
    }

    async getThreadContext(organizationId: string, leadId: string, limit = 50) {
        const lead = await this.leadsService.findOne(organizationId, leadId);
        const messages = await this.listForLead(organizationId, leadId, limit);

        return {
            lead: {
                id: lead.id,
                nombre: lead.name,
                email: lead.email,
                telefono: lead.phone,
                etapa: lead.stage,
                propiedad: lead.propertyTitle ?? null,
                propiedadId: lead.propertyId ?? null,
            },
            mensajes: messages.map((m) => ({
                fecha: m.createdAt,
                canal: m.channel,
                direccion: m.direction,
                autor: m.userName,
                texto: m.body,
            })),
            totalMensajes: messages.length,
        };
    }

    private async ensureLeadAccess(organizationId: string, leadId: string): Promise<Lead & { propertyId?: string }> {
        const lead = await this.leadsRepo.findOne({
            where: { id: leadId, organizationId },
            relations: { contact: true },
        });
        if (!lead) throw new NotFoundException('Lead not found');
        return lead;
    }

    private toView(row: ConversationMessage): ConversationMessageView {
        const userName = row.user
            ? `${row.user.firstName ?? ''} ${row.user.lastName ?? ''}`.trim() || row.user.email
            : 'Equipo';

        return {
            id: row.id,
            leadId: row.leadId,
            opportunityId: row.opportunityId,
            channel: row.channel,
            direction: row.direction,
            body: row.body,
            userId: row.userId,
            userName,
            createdAt: row.createdAt.toISOString(),
        };
    }
}
