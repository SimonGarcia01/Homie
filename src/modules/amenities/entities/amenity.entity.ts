import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PropertyAmenity } from '../../properties/entities/property-amenity.entity';

@Entity({ name: 'amenities' })
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(
    () => PropertyAmenity,
    (propertyAmenity) => propertyAmenity.amenity,
  )
  propertyAmenities?: PropertyAmenity[];
}
