import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Property } from './property.entity';

@Entity({ name: 'property_agents' })
export class PropertyAgent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId!: string;

    @Column({ length: 40, name: 'assignment_role' })
    assignmentRole!: string;

    @CreateDateColumn({ type: 'timestamptz', name: 'assigned_at' })
    assignedAt!: Date;

    @ManyToOne(() => Property, (property) => property.assignedAgents)
    @JoinColumn({ name: 'property_id' })
    property?: Property;

    @ManyToOne(() => User, (user) => user.propertyAssignments)
    @JoinColumn({ name: 'user_id' })
    user?: User;
}
