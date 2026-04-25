import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { ContactRoleType } from '../../../common/enums';

import { Contact } from './contact.entity';

@Entity({ name: 'contact_roles' })
@Unique(['contactId', 'roleType'])
export class ContactRole {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'contact_id' })
    contactId!: string;

    @Column({ type: 'enum', enum: ContactRoleType, name: 'role_type' })
    roleType!: ContactRoleType;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Contact, (contact) => contact.contactRoles)
    @JoinColumn({ name: 'contact_id' })
    contact?: Contact;
}
