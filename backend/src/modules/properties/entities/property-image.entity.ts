import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Property } from './property.entity';

export type PropertyImageType = 'gallery' | 'floor_plan' | 'video_thumbnail';

@Entity({ name: 'property_images' })
export class PropertyImage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'uuid', name: 'property_id' })
    propertyId!: string;

    @Column({ type: 'text', name: 'storage_key' })
    storageKey!: string;

    @Column({ type: 'text', name: 'image_url' })
    imageUrl!: string;

    @Column({ length: 30, name: 'image_type', default: 'gallery' })
    imageType!: PropertyImageType;

    @Column({ length: 100, name: 'mime_type' })
    mimeType!: string;

    @Column({ type: 'bigint', name: 'file_size_bytes' })
    fileSizeBytes!: string;

    @Column({ length: 255, name: 'original_filename' })
    originalFilename!: string;

    @Column({ default: 0, name: 'sort_order' })
    sortOrder!: number;

    @Index()
    @Column({ default: false, name: 'is_cover' })
    isCover!: boolean;

    @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => Property, (property) => property.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property?: Property;
}
