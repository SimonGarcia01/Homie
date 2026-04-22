import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { OwnerType } from '../../../common/enums';
import { Contact } from '../../contacts/entities/contact.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity({ name: 'owners' })
export class Owner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'contact_id', unique: true })
  contactId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId!: string;

  @Column({
    type: 'enum',
    enum: OwnerType,
    name: 'owner_type',
    default: OwnerType.PERSON,
  })
  ownerType!: OwnerType;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @ManyToOne(() => Organization, (organization) => organization.owners)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @OneToMany(() => Property, (property) => property.owner)
  properties?: Property[];
}
