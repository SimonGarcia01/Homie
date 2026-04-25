import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Owner } from '../../owners/entities/owner.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'organizations' })
export class Organization extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ length: 150 })
    name!: string;

    @Column({ length: 120, unique: true })
    slug!: string;

    @Column({ length: 80 })
    country!: string;

    @Column({ length: 80, default: 'America/Bogota', name: 'timezone' })
    timezone!: string;

    @Column({ default: true, name: 'is_active' })
    isActive!: boolean;

    @OneToMany(() => User, (user) => user.organization)
    users?: User[];

    @OneToMany(() => Contact, (contact) => contact.organization)
    contacts?: Contact[];

    @OneToMany(() => Lead, (lead) => lead.organization)
    leads?: Lead[];

    @OneToMany(() => Owner, (owner) => owner.organization)
    owners?: Owner[];
}
