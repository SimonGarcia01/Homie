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
    { value: 'office', label: 'Oficina' },
    { value: 'warehouse', label: 'Bodega' },
    { value: 'land', label: 'Lote / Terreno' },
];

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
    const [commercialStatus, setCommercialStatus] = useState<PropertyCommercialStatus>('available');
    const [publicationStatus, setPublicationStatus] = useState<PropertyPublicationStatus>('draft');
    const [isVisible, setIsVisible] = useState(true);

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
        if (!ownerId) {
            setError('Selecciona un propietario.');
            return;
        }
        setSubmitting(true);
        const payload: CreatePropertyPayload = {
            ownerId,
            code: code.trim(),
            title: title.trim(),
            description: description.trim() || undefined,
            propertyType,
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
                                    Propietario
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
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="code">
                                    Codigo interno
                                </label>
                                <input
                                    id="code"
                                    className="field-input"
                                    value={code}
                                    onChange={(ev) => setCode(ev.target.value)}
                                    maxLength={50}
                                    required
                                />
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="title">
                                    Titulo
                                </label>
                                <input
                                    id="title"
                                    className="field-input"
                                    value={title}
                                    onChange={(ev) => setTitle(ev.target.value)}
                                    maxLength={180}
                                    required
                                />
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
                                    Tipo
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
                                            <th>Codigo</th>
                                            <th>Titulo</th>
                                            <th>Tipo</th>
                                            <th>Comercial</th>
                                            <th>Pub.</th>
                                            <th>Ver</th>
                                            <th>PDF registros</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((p) => (
                                            <tr key={p.id}>
                                                <td className="mono">{p.code}</td>
                                                <td>{p.title}</td>
                                                <td>{labelOf(PROPERTY_TYPES, p.propertyType)}</td>
                                                <td>{labelOf(COMMERCIAL, p.commercialStatus)}</td>
                                                <td>{labelOf(PUBLICATION, p.publicationStatus)}</td>
                                                <td>{p.isVisible ? 'Si' : 'No'}</td>
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
