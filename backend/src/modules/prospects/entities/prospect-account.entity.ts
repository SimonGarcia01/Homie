import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../../common/entities/timestamp.entity';

import { ProspectFavorite } from './prospect-favorite.entity';
import { ProspectInquiry } from './prospect-inquiry.entity';

@Entity({ name: 'prospect_accounts' })
export class ProspectAccount extends TimestampEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ length: 180 })
    email!: string;

    @Column({ type: 'varchar', name: 'password_hash', select: false })
    passwordHash!: string;

    @Column({ length: 100, name: 'first_name' })
    firstName!: string;

    @Column({ length: 100, name: 'last_name' })
    lastName!: string;

    @Column({ length: 30, nullable: true })
    phone?: string;

    @Column({ default: true, name: 'is_active' })
    isActive!: boolean;

    @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
    lastLoginAt?: Date;

    @OneToMany(() => ProspectFavorite, (favorite) => favorite.prospect)
    favorites?: ProspectFavorite[];

    @OneToMany(() => ProspectInquiry, (inquiry) => inquiry.prospect)
    inquiries?: ProspectInquiry[];
}
