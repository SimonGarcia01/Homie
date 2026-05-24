'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Property {
    id: string;
    code: string;
    title: string;
    description?: string;
    propertyType: string;
    commercialStatus: string;
    location: {
        country: string;
        city: string;
        address?: string;
    };
    feature: {
        bedrooms: number;
        bathrooms: number;
        isFurnished: boolean;
        petsAllowed: boolean;
    };
    rentalDetail: {
        monthlyRent: number;
        currency: string;
    };
    images: Array<{
        id: string;
        imageUrl: string;
        isCover: boolean;
    }>;
    coverImageUrl?: string;
}

export default function PropertyDetailPage() {
    const params = useParams();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');

    useEffect(() => {
        const fetchProperty = async () => {
            if (!params.id) return;

            setLoading(true);
            try {
                const response = await fetch(`/api/public/properties/${params.id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Propiedad no encontrada o no disponible');
                    } else {
                        setError('Error al cargar la propiedad');
                    }
                    return;
                }

                const data: Property = await response.json();
                setProperty(data);
                setSelectedImage(data.coverImageUrl || data.images[0]?.imageUrl || '');
            } catch (error) {
                console.error('Error fetching property:', error);
                setError('Error al cargar la propiedad');
            } finally {
                setLoading(false);
            }
        };

        void fetchProperty();
    }, [params.id]);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency === 'COP' ? 'COP' : 'USD',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getPropertyTypeLabel = (type: string) => {
        const typeMap: Record<string, string> = {
            apartment: 'Apartamento',
            house: 'Casa',
            studio: 'Estudio',
            office: 'Oficina',
            warehouse: 'Bodega',
            land: 'Terreno',
            other: 'Otro',
        };
        return typeMap[type] || type;
    };

    if (loading) {
        return (
            <main className="app-shell">
                <section className="panel panel--narrow stagger">
                    <p className="kicker">Catálogo</p>
                    <h1 className="title">Cargando propiedad</h1>
                    <p className="alert alert-info">Estamos preparando la información pública del inmueble...</p>
                </section>
            </main>
        );
    }

    if (error || !property) {
        return (
            <main className="app-shell">
                <section className="panel panel--narrow stagger">
                    <p className="kicker">Catálogo</p>
                    <h1 className="title">Propiedad no encontrada</h1>
                    <p className="subtitle">{error || 'La propiedad que buscas no existe o no está disponible.'}</p>
                    <div className="actions">
                        <Link href="/catalogo" className="btn btn-primary">
                            Volver al catálogo
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="page-shell">
            <header className="app-header">
                <Link href="/catalogo" className="btn btn-ghost">
                    Volver al catálogo
                </Link>
                <Link href="/login" className="btn btn-primary">
                    Iniciar sesión
                </Link>
            </header>

            <section className="page-container detail-layout">
                <article className="media-card">
                    <div className="media-frame media-frame--main">
                        {selectedImage ? (
                            <img src={selectedImage} alt={property.title} />
                        ) : (
                            <div className="image-placeholder">Sin imagen principal</div>
                        )}
                        <span className="property-card-badge">{getPropertyTypeLabel(property.propertyType)}</span>
                    </div>

                    {property.images.length > 1 && (
                        <div className="gallery-strip">
                            {property.images.map((image) => (
                                <button
                                    key={image.id}
                                    type="button"
                                    onClick={() => setSelectedImage(image.imageUrl)}
                                    className={`gallery-button ${selectedImage === image.imageUrl ? 'is-active' : ''}`}
                                    aria-label={`Ver imagen de ${property.title}`}
                                >
                                    <img src={image.imageUrl} alt={property.title} />
                                    {image.isCover && <span className="property-card-badge">Portada</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </article>

                <aside className="detail-sidebar">
                    <div className="metric-card">
                        <p className="summary-label">Precio mensual</p>
                        <p className="metric-value">
                            {formatPrice(property.rentalDetail.monthlyRent, property.rentalDetail.currency)}
                        </p>
                        <span className="pill">Disponible</span>
                    </div>

                    <article className="surface-card">
                        <p className="kicker">Propiedad</p>
                        <h1 className="section-title">{property.title}</h1>
                        <div className="meta-list">
                            <div className="meta-item">
                                <span className="meta-label">Código</span>
                                <p className="meta-value">{property.code}</p>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Tipo</span>
                                <p className="meta-value">{getPropertyTypeLabel(property.propertyType)}</p>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Ubicación</span>
                                <p className="meta-value">
                                    {property.location.address && `${property.location.address}, `}
                                    {property.location.city}, {property.location.country}
                                </p>
                            </div>
                        </div>
                    </article>

                    <article className="surface-card">
                        <h2 className="section-title">Características</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <span className="meta-label">Habitaciones</span>
                                <p className="feature-number">{property.feature.bedrooms}</p>
                            </div>
                            <div className="feature-card">
                                <span className="meta-label">Baños</span>
                                <p className="feature-number">{property.feature.bathrooms}</p>
                            </div>
                        </div>

                        <div className="chip-row">
                            {property.feature.isFurnished && <span className="property-tag">Amueblado</span>}
                            {property.feature.petsAllowed && <span className="property-tag">Mascotas permitidas</span>}
                        </div>
                    </article>

                    {property.description && (
                        <article className="surface-card">
                            <h2 className="section-title">Descripción</h2>
                            <p className="subtitle">{property.description}</p>
                        </article>
                    )}

                    <article className="info-callout">
                        <h2 className="section-title">¿Interesado en esta propiedad?</h2>
                        <p className="subtitle">
                            Inicia sesión para contactar al propietario o solicitar más información.
                        </p>
                        <div className="actions">
                            <Link href="/login" className="btn btn-primary">
                                Iniciar sesión
                            </Link>
                        </div>
                    </article>
                </aside>
            </section>
        </main>
    );
}
