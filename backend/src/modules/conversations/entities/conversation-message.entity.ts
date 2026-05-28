import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MessageChannel, MessageDirection } from '../../../common/enums';
import { Lead } from '../../leads/entities/lead.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'conversation_messages' })
export class ConversationMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Index()
    @Column({ type: 'uuid', name: 'lead_id' })
    leadId!: string;

    @Column({ type: 'uuid', name: 'opportunity_id', nullable: true })
    opportunityId?: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @Column({ type: 'enum', enum: MessageChannel })
    channel!: MessageChannel;

    @Column({ type: 'enum', enum: MessageDirection })
    direction!: MessageDirection;

    @Column({ type: 'text' })
    body!: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @ManyToOne(() => Lead)
    @JoinColumn({ name: 'lead_id' })
    lead?: Lead;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user?: User;
}
