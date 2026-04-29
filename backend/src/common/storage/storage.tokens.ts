export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export type StoredFile = {
    storageKey: string;
    publicUrl: string;
    mimeType: string;
    sizeBytes: number;
    originalFilename: string;
};

export type StoreFileInput = {
    buffer: Buffer;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    namespace: string;
};

export interface StorageService {
    store(input: StoreFileInput): Promise<StoredFile>;
    delete(storageKey: string): Promise<void>;
    buildPublicUrl(storageKey: string): string;
}
