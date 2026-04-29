'use client';

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
            <section className="panel panel--wide stagger" style={{ width: 'min(100%, 72rem)' }}>
                <div className="top-row">
                    <div>
                        <p className="kicker">HU-02 · Galería</p>
                        <h1 className="title">Imágenes de la propiedad</h1>
                        <p className="subtitle" style={{ marginTop: 8 }}>
                            Property ID: <span className="code-inline">{propertyId}</span>
                        </p>
                    </div>
                    <Link href="/me" className="btn btn-ghost">
                        Volver
                    </Link>
                </div>

                <div className="info-callout" style={{ marginTop: 16 }}>
                    Formatos aceptados: <strong>{ALLOWED_IMAGE_EXTENSIONS_LABEL}</strong>. Tamaño máximo:{' '}
                    <strong>{MAX_IMAGE_MB} MB</strong> por imagen.
                </div>

                <div className="stack stack-lg" style={{ marginTop: 20 }}>
                    <label className="btn btn-primary" htmlFor="property-image-upload" style={{ width: 'fit-content' }}>
                        Seleccionar imágenes
                    </label>
                    <input
                        id="property-image-upload"
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFiles}
                        disabled={uploadState.type === 'uploading' || !propertyId}
                        style={{ display: 'none' }}
                    />

                    {uploadState.message && (
                        <p
                            className={
                                uploadState.type === 'error'
                                    ? 'alert alert-error'
                                    : uploadState.type === 'success'
                                        ? 'alert alert-info'
                                        : 'alert alert-info'
                            }
                        >
                            {uploadState.message}
                        </p>
                    )}

                    {rejected.length > 0 && (
                        <div className="alert alert-error" style={{ display: 'block' }}>
                            <strong>Archivos rechazados:</strong>
                            <ul style={{ margin: '6px 0 0 18px' }}>
                                {rejected.map((item, index) => (
                                    <li key={`${item.filename}-${index}`}>
                                        <span className="code-inline">{item.filename}</span> — {item.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)' }} />

                {loading ? (
                    <p className="alert alert-info">Cargando imágenes...</p>
                ) : loadError ? (
                    <p className="alert alert-error">{loadError}</p>
                ) : images.length === 0 ? (
                    <p className="alert alert-info">Aún no hay imágenes para esta propiedad.</p>
                ) : (
                    <>
                        <p className="subtitle" style={{ marginBottom: 12 }}>
                            {images.length} imagen(es).{' '}
                            {cover ? (
                                <>
                                    Portada actual: <span className="code-inline">{cover.originalFilename}</span>
                                </>
                            ) : (
                                'Sin portada definida.'
                            )}
                        </p>

                        <div
                            style={{
                                display: 'grid',
                                gap: 16,
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            }}
                        >
                            {images.map((image) => (
                                <article
                                    key={image.id}
                                    style={{
                                        border: image.isCover
                                            ? '2px solid var(--primary)'
                                            : '1px solid rgba(0,0,0,0.08)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.85)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            aspectRatio: '4 / 3',
                                            background: '#000',
                                        }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image.url}
                                            alt={image.originalFilename}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                        {image.isCover && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    background: 'var(--primary)',
                                                    color: 'var(--primary-ink)',
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Portada
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ padding: 12, display: 'grid', gap: 6 }}>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: 13,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                            title={image.originalFilename}
                                        >
                                            {image.originalFilename}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--ink-500)' }}>
                                            {formatBytes(image.sizeBytes)} · {image.mimeType}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
                                                onClick={() => handleSetCover(image.id)}
                                                disabled={image.isCover || busyImageId === image.id}
                                            >
                                                {image.isCover ? 'Es portada' : 'Marcar portada'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 10px',
                                                    fontSize: 12,
                                                    color: 'var(--alert-error-ink)',
                                                }}
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
