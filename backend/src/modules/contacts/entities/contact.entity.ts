import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Organization } from '../../organizations/entities/organization.entity';

import { ContactRole } from './contact-role.entity';

@Entity({ name: 'contacts' })
export class Contact extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'organization_id' })
    organizationId!: string;

    @Column({ length: 100, name: 'first_name' })
    firstName!: string;

    @Column({ length: 100, name: 'last_name' })
    lastName!: string;

    @Column({ length: 180, nullable: true })
    email?: string;

    @Column({ length: 30, nullable: true })
    phone?: string;

    @ManyToOne(() => Organization, (organization) => organization.contacts)
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization;

    @OneToMany(() => ContactRole, (contactRole) => contactRole.contact)
    contactRoles?: ContactRole[];

    @OneToMany(() => Lead, (lead) => lead.contact)
    leads?: Lead[];
}
