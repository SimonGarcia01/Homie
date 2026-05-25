import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { STORAGE_SERVICE } from '../../common/storage/storage.tokens';
import type { StorageService } from '../../common/storage/storage.tokens';

import {
    PropertyImageResponseDto,
    RejectedImageDto,
    UploadPropertyImagesResponseDto,
} from './dto/property-image-response.dto';
import { PropertyImage } from './entities/property-image.entity';
import { Property } from './entities/property.entity';
import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_IMAGE_EXTENSIONS, MAX_IMAGE_BYTES } from './property-images.constants';

type IncomingFile = {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
};

@Injectable()
export class PropertyImagesService {
    constructor(
        @InjectRepository(PropertyImage)
        private readonly imagesRepo: Repository<PropertyImage>,
        @InjectRepository(Property)
        private readonly propertiesRepo: Repository<Property>,
        @Inject(STORAGE_SERVICE)
        private readonly storage: StorageService,
        private readonly dataSource: DataSource,
    ) {}

    async listForProperty(propertyId: string, organizationId: string): Promise<PropertyImageResponseDto[]> {
        await this.ensurePropertyAccess(propertyId, organizationId);

        const images = await this.imagesRepo.find({
            where: { propertyId },
            order: { isCover: 'DESC', sortOrder: 'ASC', createdAt: 'ASC' },
        });

        return images.map((image) => this.toResponse(image));
    }

    async upload(
        propertyId: string,
        organizationId: string,
        files: IncomingFile[] | undefined,
    ): Promise<UploadPropertyImagesResponseDto> {
        await this.ensurePropertyAccess(propertyId, organizationId);

        const uploaded: PropertyImageResponseDto[] = [];
        const rejected: RejectedImageDto[] = [];

        if (!files || files.length === 0) {
            return { uploaded, rejected };
        }

        const existingCount = await this.imagesRepo.count({ where: { propertyId } });
        const hasCover = (await this.imagesRepo.count({ where: { propertyId, isCover: true } })) > 0;
        let nextSortOrder = existingCount;
        let coverAssigned = hasCover;

        for (const file of files) {
            const validationError = this.validateFile(file);
            if (validationError) {
                rejected.push({ filename: file.originalname, reason: validationError });
                continue;
            }

            try {
                const stored = await this.storage.store({
                    buffer: file.buffer,
                    originalFilename: file.originalname,
                    mimeType: file.mimetype,
                    sizeBytes: file.size,
                    namespace: `properties/${propertyId}`,
                });

                const shouldBeCover = !coverAssigned;
                const entity = this.imagesRepo.create({
                    propertyId,
                    storageKey: stored.storageKey,
                    imageUrl: stored.publicUrl,
                    imageType: 'gallery',
                    mimeType: stored.mimeType,
                    fileSizeBytes: String(stored.sizeBytes),
                    originalFilename: stored.originalFilename,
                    sortOrder: nextSortOrder,
                    isCover: shouldBeCover,
                });
                const saved = await this.imagesRepo.save(entity);

                if (shouldBeCover) {
                    coverAssigned = true;
                }
                nextSortOrder += 1;
                uploaded.push(this.toResponse(saved));
            } catch (error) {
                rejected.push({
                    filename: file.originalname,
                    reason: this.normalizeError(error),
                });
            }
        }

        return { uploaded, rejected };
    }

    async remove(
        propertyId: string,
        organizationId: string,
        imageId: string,
    ): Promise<{ id: string; newCoverId: string | null }> {
        await this.ensurePropertyAccess(propertyId, organizationId);

        const image = await this.imagesRepo.findOne({ where: { id: imageId, propertyId } });
        if (!image) throw new NotFoundException('Image not found');

        await this.dataSource.transaction(async (manager) => {
            await manager.remove(image);

            if (image.isCover) {
                const replacement = await manager.findOne(PropertyImage, {
                    where: { propertyId },
                    order: { sortOrder: 'ASC', createdAt: 'ASC' },
                });
                if (replacement) {
                    replacement.isCover = true;
                    await manager.save(replacement);
                }
            }
        });

        try {
            await this.storage.delete(image.storageKey);
        } catch {
            // Storage cleanup failures should not block DB consistency.
        }

        const newCover = image.isCover ? await this.imagesRepo.findOne({ where: { propertyId, isCover: true } }) : null;

        return { id: image.id, newCoverId: newCover?.id ?? null };
    }

    async setCover(propertyId: string, organizationId: string, imageId: string): Promise<PropertyImageResponseDto> {
        await this.ensurePropertyAccess(propertyId, organizationId);

        const image = await this.imagesRepo.findOne({ where: { id: imageId, propertyId } });
        if (!image) throw new NotFoundException('Image not found');

        await this.dataSource.transaction(async (manager) => {
            await manager.update(PropertyImage, { propertyId, isCover: true }, { isCover: false });
            await manager.update(PropertyImage, { id: imageId }, { isCover: true });
        });

        const refreshed = await this.imagesRepo.findOneOrFail({ where: { id: imageId } });
        return this.toResponse(refreshed);
    }

    private validateFile(file: IncomingFile): string | null {
        if (!file.buffer || file.size === 0) {
            return 'Empty file';
        }
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            return `Unsupported file type. Allowed formats: ${ALLOWED_IMAGE_EXTENSIONS.join(', ').toUpperCase()}`;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            return `File exceeds maximum size of ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB`;
        }
        return null;
    }

    private async ensurePropertyAccess(propertyId: string, organizationId: string): Promise<void> {
        const exists = await this.propertiesRepo.exists({ where: { id: propertyId, organizationId } });
        if (!exists) throw new NotFoundException('Property not found');
    }

    private toResponse(image: PropertyImage): PropertyImageResponseDto {
        return {
            id: image.id,
            propertyId: image.propertyId,
            url: image.imageUrl,
            storageKey: image.storageKey,
            mimeType: image.mimeType,
            sizeBytes: Number(image.fileSizeBytes),
            originalFilename: image.originalFilename,
            isCover: image.isCover,
            sortOrder: image.sortOrder,
            createdAt: image.createdAt?.toISOString?.() ?? new Date().toISOString(),
        };
    }

    private normalizeError(error: unknown): string {
        if (error instanceof Error) return error.message;
        return 'Unknown error while storing the file';
    }
}
