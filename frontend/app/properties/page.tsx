'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { getAccessToken, logout } from '../lib/auth';
import { getOwnerOptions, OwnerOption } from '../lib/owners';
import {
    CreatePropertyPayload,
    Property,
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
    createProperty,
    downloadPropertyRecordsPdf,
    listPropertiesFull,
} from '../lib/properties';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
    { value: 'apartment', label: 'Apartamento' },
    { value: 'house', label: 'Casa' },
    { value: 'studio', label: 'Apartaestudio' },
    { value: 'office', label: 'Oficina / Local' },
    { value: 'warehouse', label: 'Bodega' },
    { value: 'land', label: 'Lote / Terreno' },
    { value: 'other', label: 'Otro' },
];

function formatCop(value: string | number | undefined | null): string {
    if (value === undefined || value === null || value === '') return '—';
    const num = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(num)) return '—';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(num);
}

function formatLocation(location: { city: string; country: string; address?: string | null } | null | undefined): string {
    if (!location) return '—';
    const parts = [location.address, location.city, location.country].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(', ') : '—';
}

const COMMERCIAL: { value: PropertyCommercialStatus; label: string }[] = [
    { value: 'available', label: 'Disponible' },
    { value: 'reserved', label: 'Reservado' },
    { value: 'rented', label: 'Arrendado' },
    { value: 'inactive', label: 'Inactivo' },
];

const PUBLICATION: { value: PropertyPublicationStatus; label: string }[] = [
    { value: 'draft', label: 'Borrador' },
    { value: 'published', label: 'Publicado' },
    { value: 'hidden', label: 'Oculto' },
];

function labelOf<T extends string>(map: { value: T; label: string }[], v: T) {
    return map.find((x) => x.value === v)?.label ?? v;
}

export default function PropertiesPage() {
    const router = useRouter();
    const [rows, setRows] = useState<Property[]>([]);
    const [owners, setOwners] = useState<OwnerOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

    const [ownerId, setOwnerId] = useState('');
    const [code, setCode] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [currency, setCurrency] = useState('COP');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('Colombia');
    const [address, setAddress] = useState('');
    const [commercialStatus, setCommercialStatus] = useState<PropertyCommercialStatus>('available');
    const [publicationStatus, setPublicationStatus] = useState<PropertyPublicationStatus>('draft');
    const [isVisible, setIsVisible] = useState(true);

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!getAccessToken()) {
            router.replace('/login');
            return;
        }

        let alive = true;

        async function load() {
            setLoading(true);
            const [propsRes, ownersRes] = await Promise.all([listPropertiesFull(), getOwnerOptions()]);
            if (!alive) return;

            if ('error' in propsRes) {
                if (propsRes.status === 401) {
                    logout();
                    router.replace('/login');
                    return;
                }
                setError(propsRes.error);
                setLoading(false);
                return;
            }

            if ('error' in ownersRes) {
                setError(ownersRes.error);
                setLoading(false);
                return;
            }

            setRows(propsRes);
            setOwners(ownersRes);
            if (ownersRes.length > 0) {
                setOwnerId((prev) => prev || ownersRes[0].id);
            }
            setError(null);
            setLoading(false);
        }

        void load();
        return () => {
            alive = false;
        };
    }, [router]);

    async function refreshList() {
        const propsRes = await listPropertiesFull();
        if ('error' in propsRes) return;
        setRows(propsRes);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const errors: Record<string, string> = {};
        if (!ownerId) errors.ownerId = 'Selecciona un propietario.';
        if (!code.trim()) errors.code = 'El código es obligatorio.';
        if (!title.trim()) errors.title = 'El nombre es obligatorio.';
        const rentNumber = Number(monthlyRent);
        if (!monthlyRent.trim()) {
            errors.monthlyRent = 'El precio es obligatorio.';
        } else if (!Number.isFinite(rentNumber) || rentNumber <= 0) {
            errors.monthlyRent = 'El precio debe ser un número mayor a 0.';
        }
        if (!city.trim()) errors.city = 'La ciudad es obligatoria.';

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setError('Revisa los campos obligatorios.');
            return;
        }

        setSubmitting(true);
        const payload: CreatePropertyPayload = {
            ownerId,
            code: code.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            propertyType,
            monthlyRent: rentNumber,
            currency: currency.trim() || undefined,
            city: city.trim(),
            country: country.trim() || undefined,
            address: address.trim() || undefined,
            commercialStatus,
            publicationStatus,
            isVisible,
        };
        const res = await createProperty(payload);
        setSubmitting(false);
        if ('error' in res) {
            setError(res.error);
            return;
        }
        setSuccess('Propiedad registrada correctamente.');
        setCode('');
        setTitle('');
        setDescription('');
        setMonthlyRent('');
        setCity('');
        setAddress('');
        setFieldErrors({});
        await refreshList();
    }

    async function handlePdf(propertyId: string) {
        setError(null);
        setPdfBusyId(propertyId);
        const res = await downloadPropertyRecordsPdf(propertyId);
        setPdfBusyId(null);
        if (res !== true) {
            setError(res.error);
        }
    }

    return (
        <main className="app-shell">
            <section className="panel panel--wide stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">Directorio</p>
                        <h1 className="title">Propiedades</h1>
                    </div>
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                            logout();
                            router.push('/login');
                        }}
                    >
                        Salir
                    </button>
                </div>

                <p className="subtitle">
                    Alta de propiedades y listado de tu organizacion. Descarga un PDF con los registros de ingresos por
                    inmueble.
                </p>

                <div className="property-layout">
                    <article className="income-column">
                        <h2 className="section-title">Nueva propiedad</h2>
                        <form className="stack stack-lg" onSubmit={handleSubmit}>
                            <div className="field">
                                <label className="field-label" htmlFor="ownerId">
                                    Propietario *
                                </label>
                                <select
                                    id="ownerId"
                                    className="field-input"
                                    value={ownerId}
                                    onChange={(ev) => setOwnerId(ev.target.value)}
                                    required
                                >
                                    {owners.length === 0 ? (
                                        <option value="">Sin propietarios (ejecuta el seed)</option>
                                    ) : null}
                                    {owners.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.label}
                                            {o.email ? ` · ${o.email}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.ownerId && <p className="field-error">{fieldErrors.ownerId}</p>}
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="code">
                                    Código interno *
                                </label>
                                <input
                                    id="code"
                                    className="field-input"
                                    value={code}
                                    onChange={(ev) => setCode(ev.target.value)}
                                    maxLength={50}
                                    required
                                />
                                {fieldErrors.code && <p className="field-error">{fieldErrors.code}</p>}
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="title">
                                    Nombre *
                                </label>
                                <input
                                    id="title"
                                    className="field-input"
                                    value={title}
                                    onChange={(ev) => setTitle(ev.target.value)}
                                    maxLength={180}
                                    required
                                />
                                {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="description">
                                    Descripcion
                                </label>
                                <textarea
                                    id="description"
                                    className="field-input field-input--textarea"
                                    value={description}
                                    onChange={(ev) => setDescription(ev.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="propertyType">
                                    Tipo *
                                </label>
                                <select
                                    id="propertyType"
                                    className="field-input"
                                    value={propertyType}
                                    onChange={(ev) => setPropertyType(ev.target.value as PropertyType)}
                                >
                                    {PROPERTY_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="income-filters">
                                <div className="field">
                                    <label className="field-label" htmlFor="monthlyRent">
                                        Precio mensual *
                                    </label>
                                    <input
                                        id="monthlyRent"
                                        className="field-input"
                                        type="number"
                                        min="0"
                                        step="1000"
                                        inputMode="decimal"
                                        value={monthlyRent}
                                        onChange={(ev) => setMonthlyRent(ev.target.value)}
                                        required
                                    />
                                    {fieldErrors.monthlyRent && <p className="field-error">{fieldErrors.monthlyRent}</p>}
                                </div>
                                <div className="field">
                                    <label className="field-label" htmlFor="currency">
                                        Moneda
                                    </label>
                                    <input
                                        id="currency"
                                        className="field-input"
                                        value={currency}
                                        onChange={(ev) => setCurrency(ev.target.value.toUpperCase())}
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="income-filters">
                                <div className="field">
                                    <label className="field-label" htmlFor="city">
                                        Ciudad *
                                    </label>
                                    <input
                                        id="city"
                                        className="field-input"
                                        value={city}
                                        onChange={(ev) => setCity(ev.target.value)}
                                        maxLength={120}
                                        required
                                    />
                                    {fieldErrors.city && <p className="field-error">{fieldErrors.city}</p>}
                                </div>
                                <div className="field">
                                    <label className="field-label" htmlFor="country">
                                        País
                                    </label>
                                    <input
                                        id="country"
                                        className="field-input"
                                        value={country}
                                        onChange={(ev) => setCountry(ev.target.value)}
                                        maxLength={80}
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label className="field-label" htmlFor="address">
                                    Dirección
                                </label>
                                <input
                                    id="address"
                                    className="field-input"
                                    value={address}
                                    onChange={(ev) => setAddress(ev.target.value)}
                                    maxLength={255}
                                    placeholder="Ej. Av. Roosevelt 23-45"
                                />
                            </div>

                            <div className="income-filters">
                                <div className="field">
                                    <label className="field-label" htmlFor="commercialStatus">
                                        Estado comercial
                                    </label>
                                    <select
                                        id="commercialStatus"
                                        className="field-input"
                                        value={commercialStatus}
                                        onChange={(ev) =>
                                            setCommercialStatus(ev.target.value as PropertyCommercialStatus)
                                        }
                                    >
                                        {COMMERCIAL.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label className="field-label" htmlFor="publicationStatus">
                                        Publicacion
                                    </label>
                                    <select
                                        id="publicationStatus"
                                        className="field-input"
                                        value={publicationStatus}
                                        onChange={(ev) =>
                                            setPublicationStatus(ev.target.value as PropertyPublicationStatus)
                                        }
                                    >
                                        {PUBLICATION.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <label className="check-row">
                                <input type="checkbox" checked={isVisible} onChange={(ev) => setIsVisible(ev.target.checked)} />
                                <span>Visible para clientes / buscadores</span>
                            </label>

                            <button type="submit" className="btn btn-primary" disabled={submitting || owners.length === 0}>
                                {submitting ? 'Guardando...' : 'Registrar propiedad'}
                            </button>
                        </form>
                    </article>

                    <article className="income-column property-list-wrap">
                        <h2 className="section-title">Listado ({rows.length})</h2>
                        {loading && <p className="alert alert-info">Cargando...</p>}
                        {!loading && rows.length === 0 && (
                            <p className="alert alert-info">No hay propiedades. Crea la primera con el formulario.</p>
                        )}
                        {!loading && rows.length > 0 && (
                            <div className="table-scroll">
                                <table className="property-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Nombre</th>
                                            <th>Tipo</th>
                                            <th>Precio</th>
                                            <th>Ubicación</th>
                                            <th>Estado</th>
                                            <th>Pub.</th>
                                            <th>Ver</th>
                                            <th>Imágenes</th>
                                            <th>PDF registros</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((p) => (
                                            <tr key={p.id}>
                                                <td className="mono">{p.code}</td>
                                                <td>{p.title}</td>
                                                <td>{labelOf(PROPERTY_TYPES, p.propertyType)}</td>
                                                <td>{formatCop(p.rentalDetail?.monthlyRent)}</td>
                                                <td>{formatLocation(p.location)}</td>
                                                <td>{labelOf(COMMERCIAL, p.commercialStatus)}</td>
                                                <td>{labelOf(PUBLICATION, p.publicationStatus)}</td>
                                                <td>{p.isVisible ? 'Si' : 'No'}</td>
                                                <td>
                                                    <Link
                                                        href={`/properties/${p.id}/images`}
                                                        className="btn btn-secondary btn--compact"
                                                    >
                                                        Galería
                                                    </Link>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn--compact"
                                                        disabled={pdfBusyId === p.id}
                                                        onClick={() => handlePdf(p.id)}
                                                    >
                                                        {pdfBusyId === p.id ? 'Generando...' : 'Descargar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </article>
                </div>

                {error && <p className="alert alert-error">{error}</p>}
                {success && <p className="alert alert-info">{success}</p>}

                <div className="footer-links">
                    <Link href="/">Inicio</Link>
                    <Link href="/incomes">Ingresos</Link>
                    <Link href="/finanzas">Finanzas</Link>
                    <Link href="/me">Perfil</Link>
                </div>
            </section>
        </main>
    );
}
