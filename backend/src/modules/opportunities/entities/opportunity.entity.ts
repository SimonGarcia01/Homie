import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { OpportunityStatus } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Activity } from '../../activities/entities/activity.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { RentalApplication } from '../../rental-applications/entities/rental-application.entity';
import { TaskItem } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';
import { Visit } from '../../visits/entities/visit.entity';

import { OpportunityProperty } from './opportunity-property.entity';
import { Pipeline } from './pipeline.entity';
import { PipelineStage } from './pipeline-stage.entity';

@Entity({ name: 'opportunities' })
export class Opportunity extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Column({ type: 'uuid', name: 'lead_id' })
    leadId!: string;

    @Column({ type: 'uuid', name: 'owner_user_id' })
    ownerUserId!: string;

    @Column({ type: 'uuid', name: 'pipeline_id' })
    pipelineId!: string;

    @Column({ type: 'uuid', name: 'stage_id' })
    stageId!: string;

    @Column({
        type: 'enum',
        enum: OpportunityStatus,
        default: OpportunityStatus.OPEN,
    })
    status!: OpportunityStatus;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @ManyToOne(() => Lead)
    @JoinColumn({ name: 'lead_id' })
    lead?: Lead;

    @ManyToOne(() => User, (user) => user.ownedOpportunities)
    @JoinColumn({ name: 'owner_user_id' })
    ownerUser?: User;

    @ManyToOne(() => Pipeline)
    @JoinColumn({ name: 'pipeline_id' })
    pipeline?: Pipeline;

    @ManyToOne(() => PipelineStage)
    @JoinColumn({ name: 'stage_id' })
    stage?: PipelineStage;

    @OneToMany(() => OpportunityProperty, (opportunityProperty) => opportunityProperty.opportunity)
    candidateProperties?: OpportunityProperty[];

    @OneToMany(() => Visit, (visit) => visit.opportunity)
    visits?: Visit[];

    @OneToMany(() => Activity, (activity) => activity.opportunity)
    activities?: Activity[];

    @OneToMany(() => TaskItem, (task) => task.opportunity)
    tasks?: TaskItem[];

    @OneToMany(() => RentalApplication, (rentalApplication) => rentalApplication.opportunity)
    rentalApplications?: RentalApplication[];
}
