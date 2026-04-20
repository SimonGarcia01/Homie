import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Property } from './property.entity';

@Entity({ name: 'property_images' })
export class PropertyImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'property_id' })
  propertyId!: string;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl!: string;

  @Column({ default: 0, name: 'sort_order' })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Property, (property) => property.images)
  @JoinColumn({ name: 'property_id' })
  property?: Property;
}
