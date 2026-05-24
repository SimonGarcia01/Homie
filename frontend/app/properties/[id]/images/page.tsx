'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { getAccessToken } from '../../../lib/auth';
import {
    ALLOWED_IMAGE_EXTENSIONS_LABEL,
    deletePropertyImage,
    formatBytes,
    listPropertyImages,
    MAX_IMAGE_MB,
    PropertyImage,
    RejectedImage,
    setPropertyImageCover,
    uploadPropertyImages,
    validateImageClientSide,
} from '../../../lib/property-images';

type ActionState = {
    type: 'idle' | 'uploading' | 'success' | 'error';
    message?: string;
};

export default function PropertyImagesPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const propertyId = params?.id ?? '';

    const [images, setImages] = useState<PropertyImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [uploadState, setUploadState] = useState<ActionState>({ type: 'idle' });
    const [rejected, setRejected] = useState<RejectedImage[]>([]);
    const [busyImageId, setBusyImageId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!getAccessToken()) {
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        if (!propertyId) return;
        let cancelled = false;
        (async () => {
            const response = await listPropertyImages(propertyId);
            if (cancelled) return;
            if ('error' in response) {
                setLoadError(response.error);
                setImages([]);
            } else {
                setLoadError(null);
                setImages(response);
            }
            setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [propertyId, refreshKey]);

    function refresh() {
        setRefreshKey((value) => value + 1);
    }

    async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
        const fileList = event.target.files;
        if (!fileList || fileList.length === 0) return;

        const allFiles = Array.from(fileList);
        const accepted: File[] = [];
        const localRejected: RejectedImage[] = [];

        for (const file of allFiles) {
            const error = validateImageClientSide(file);
            if (error) {
                localRejected.push({ filename: file.name, reason: error });
            } else {
                accepted.push(file);
            }
        }

        setRejected(localRejected);

        if (accepted.length === 0) {
            setUploadState({
                type: 'error',
                message: `Ningún archivo válido. Formatos: ${ALLOWED_IMAGE_EXTENSIONS_LABEL}. Máximo ${MAX_IMAGE_MB} MB.`,
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploadState({ type: 'uploading', message: `Subiendo ${accepted.length} archivo(s)...` });

        const response = await uploadPropertyImages(propertyId, accepted);

        if ('error' in response) {
            setUploadState({ type: 'error', message: response.error });
        } else {
            setRejected((prev) => [...prev, ...response.rejected]);
            const successCount = response.uploaded.length;
            const failureCount = response.rejected.length + localRejected.length;
            setUploadState({
                type: 'success',
                message:
                    failureCount > 0
                        ? `Subidas: ${successCount}. Rechazadas: ${failureCount}.`
                        : `Subidas: ${successCount}.`,
            });
            refresh();
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleDelete(imageId: string) {
        if (!confirm('¿Eliminar esta imagen?')) return;
        setBusyImageId(imageId);
        const response = await deletePropertyImage(propertyId, imageId);
        setBusyImageId(null);
        if ('error' in response) {
            setUploadState({ type: 'error', message: response.error });
            return;
        }
        refresh();
    }

    async function handleSetCover(imageId: string) {
        setBusyImageId(imageId);
        const response = await setPropertyImageCover(propertyId, imageId);
        setBusyImageId(null);
        if ('error' in response) {
            setUploadState({ type: 'error', message: response.error });
            return;
        }
        refresh();
    }

    const cover = useMemo(() => images.find((image) => image.isCover) ?? null, [images]);

    return (
        <main className="app-shell">
            <section className="panel panel--wide stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">HU-02 · Galería</p>
                        <h1 className="title">Imágenes de la propiedad</h1>
                        <p className="subtitle">
                            Property ID: <span className="code-inline">{propertyId}</span>
                        </p>
                    </div>
                    <Link href="/me" className="btn btn-ghost">
                        Volver
                    </Link>
                </div>

                <div className="info-callout">
                    Formatos aceptados: <strong>{ALLOWED_IMAGE_EXTENSIONS_LABEL}</strong>. Tamaño máximo:{' '}
                    <strong>{MAX_IMAGE_MB} MB</strong> por imagen.
                </div>

                <div className="upload-panel">
                    <div className="upload-actions">
                        <label className="btn btn-primary btn--fit" htmlFor="property-image-upload">
                            Seleccionar imágenes
                        </label>
                    </div>
                    <input
                        id="property-image-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFiles}
                        disabled={uploadState.type === 'uploading' || !propertyId}
                        className="file-input-hidden"
                    />

                    {uploadState.message && (
                        <p className={uploadState.type === 'error' ? 'alert alert-error' : 'alert alert-info'}>
                            {uploadState.message}
                        </p>
                    )}

                    {rejected.length > 0 && (
                        <div className="alert alert-error">
                            <strong>Archivos rechazados:</strong>
                            <ul className="rejected-list">
                                {rejected.map((item, index) => (
                                    <li key={`${item.filename}-${index}`}>
                                        <span className="code-inline">{item.filename}</span> — {item.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <hr className="divider" />

                {loading ? (
                    <p className="alert alert-info">Cargando imágenes...</p>
                ) : loadError ? (
                    <p className="alert alert-error">{loadError}</p>
                ) : images.length === 0 ? (
                    <p className="empty-state">Aún no hay imágenes para esta propiedad.</p>
                ) : (
                    <>
                        <p className="subtitle">
                            {images.length} imagen(es).{' '}
                            {cover ? (
                                <>
                                    Portada actual: <span className="code-inline">{cover.originalFilename}</span>
                                </>
                            ) : (
                                'Sin portada definida.'
                            )}
                        </p>

                        <div className="gallery-grid">
                            {images.map((image) => (
                                <article key={image.id} className={`image-tile ${image.isCover ? 'is-cover' : ''}`}>
                                    <div className="image-tile-media">
                                        <img src={image.url} alt={image.originalFilename} />
                                        {image.isCover && <span className="property-card-badge">Portada</span>}
                                    </div>
                                    <div className="image-tile-body">
                                        <p className="image-tile-name" title={image.originalFilename}>
                                            {image.originalFilename}
                                        </p>
                                        <p className="summary-meta">
                                            {formatBytes(image.sizeBytes)} · {image.mimeType}
                                        </p>
                                        <div className="image-actions">
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn--compact"
                                                onClick={() => handleSetCover(image.id)}
                                                disabled={image.isCover || busyImageId === image.id}
                                            >
                                                {image.isCover ? 'Es portada' : 'Marcar portada'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn--compact"
                                                onClick={() => handleDelete(image.id)}
                                                disabled={busyImageId === image.id}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}
