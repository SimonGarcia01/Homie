'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getAccessToken } from '../lib/auth';
import { listProperties, PropertySummary } from '../lib/properties';

export default function PropertiesListPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<PropertySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!getAccessToken()) {
            router.replace('/login');
        }
    }, [router]);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            const response = await listProperties();
            if (cancelled) return;
            if ('error' in response) {
                setError(response.error);
                setProperties([]);
            } else {
                setProperties(response);
            }
            setLoading(false);
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="app-shell">
            <section className="panel panel--medium stagger" style={{ width: 'min(100%, 56rem)' }}>
                <div className="top-row">
                    <div>
                        <p className="kicker">Inventario</p>
                        <h1 className="title">Propiedades</h1>
                    </div>
                    <Link href="/me" className="btn btn-ghost">
                        Volver
                    </Link>
                </div>

                <p className="subtitle">
                    Selecciona una propiedad para gestionar su galería de imágenes (HU-02).
                </p>

                {loading && <p className="alert alert-info">Cargando propiedades...</p>}
                {!loading && error && <p className="alert alert-error">{error}</p>}
                {!loading && !error && properties.length === 0 && (
                    <p className="alert alert-info">No hay propiedades. Ejecuta el seed para crear datos demo.</p>
                )}

                {!loading && properties.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gap: 14,
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            marginTop: 12,
                        }}
                    >
                        {properties.map((property) => (
                            <Link
                                key={property.id}
                                href={`/properties/${property.id}/images`}
                                style={{
                                    display: 'block',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'rgba(255,255,255,0.85)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        aspectRatio: '4 / 3',
                                        background: '#222',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#aaa',
                                        fontSize: 12,
                                    }}
                                >
                                    {property.coverImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={property.coverImageUrl}
                                            alt={property.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        'Sin portada'
                                    )}
                                </div>
                                <div style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600 }}>{property.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 4 }}>
                                        {property.code} · {property.propertyType}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
