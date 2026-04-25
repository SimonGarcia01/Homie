import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { UserRoleName } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'roles' })
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: UserRoleName, unique: true })
    name!: UserRoleName;

    @Column({ length: 255, nullable: true })
    description?: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => User, (user) => user.role)
    users?: User[];
}
