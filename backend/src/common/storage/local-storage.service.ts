import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join, normalize, relative, sep } from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorageService, StoredFile, StoreFileInput } from './storage.tokens';

@Injectable()
export class LocalStorageService implements StorageService {
    private readonly logger = new Logger(LocalStorageService.name);
    private readonly rootDir: string;
    private readonly publicBaseUrl: string;
    private readonly publicPrefix: string;

    constructor(configService: ConfigService) {
        this.rootDir = normalize(configService.get<string>('UPLOADS_DIR', join(process.cwd(), 'uploads')));
        this.publicPrefix = configService.get<string>('UPLOADS_PUBLIC_PREFIX', '/uploads').replace(/\/+$/, '');
        this.publicBaseUrl = configService.get<string>('PUBLIC_BASE_URL', '').replace(/\/+$/, '');
    }

    async store(input: StoreFileInput): Promise<StoredFile> {
        const safeNamespace = this.sanitizeSegment(input.namespace);
        const ext = extname(input.originalFilename).toLowerCase();
        const filename = `${randomUUID()}${ext}`;
        const targetDir = join(this.rootDir, safeNamespace);

        await fs.mkdir(targetDir, { recursive: true });
        const targetPath = join(targetDir, filename);
        await fs.writeFile(targetPath, input.buffer);

        const storageKey = relative(this.rootDir, targetPath).split(sep).join('/');

        return {
            storageKey,
            publicUrl: this.buildPublicUrl(storageKey),
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            originalFilename: input.originalFilename,
        };
    }

    async delete(storageKey: string): Promise<void> {
        const safeKey = this.sanitizeKey(storageKey);
        const fullPath = join(this.rootDir, safeKey);

        try {
            await fs.unlink(fullPath);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code !== 'ENOENT') {
                throw error;
            }
            this.logger.warn(`Tried to delete missing file ${safeKey}`);
        }
    }

    buildPublicUrl(storageKey: string): string {
        const safeKey = this.sanitizeKey(storageKey);
        const path = `${this.publicPrefix}/${safeKey}`;
        return this.publicBaseUrl ? `${this.publicBaseUrl}${path}` : path;
    }

    private sanitizeSegment(segment: string): string {
        return segment.replace(/[^a-zA-Z0-9._-]/g, '');
    }

    private sanitizeKey(storageKey: string): string {
        const normalized = normalize(storageKey).split(sep).join('/');
        if (normalized.startsWith('..') || normalized.includes('/../') || normalized.startsWith('/')) {
            throw new Error('Invalid storage key');
        }
        return normalized;
    }
}
