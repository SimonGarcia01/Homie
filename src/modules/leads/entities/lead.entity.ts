import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { LeadStatus, LeadTemperature } from '../../../common/enums';
import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import { SearchPreference } from './search-preference.entity';

@Entity({ name: 'leads' })
export class Lead extends TimestampEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'uuid', name: 'contact_id' })
  contactId!: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId!: string;

  @Column({ length: 50 })
  source!: string;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status!: LeadStatus;

  @Column({ default: 0 })
  score!: number;

  @Column({
    type: 'enum',
    enum: LeadTemperature,
    default: LeadTemperature.COLD,
  })
  temperature!: LeadTemperature;

  @ManyToOne(() => Organization, (organization) => organization.leads)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @ManyToOne(() => Contact, (contact) => contact.leads)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @ManyToOne(() => User, (user) => user.ownedLeads)
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser?: User;

  @OneToMany(
    () => SearchPreference,
    (searchPreference) => searchPreference.lead,
  )
  searchPreferences?: SearchPreference[];
}
