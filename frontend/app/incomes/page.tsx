'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
    createIncome,
    deleteIncome,
    getIncomeSummary,
    getIncomes,
    getProperties,
    IncomePayload,
    IncomeSummary,
    PropertyIncome,
    PropertyIncomeType,
    PropertyOption,
    updateIncome,
} from '../lib/property-incomes';
import { getAccessToken, logout } from '../lib/auth';

type IncomeFormState = {
    amount: string;
    incomeDate: string;
    incomeType: PropertyIncomeType;
    description: string;
};

const EMPTY_FORM: IncomeFormState = {
    amount: '',
    incomeDate: new Date().toISOString().slice(0, 10),
    incomeType: 'arriendo',
    description: '',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(value: string) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('es-CO');
}

export default function IncomesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [incomes, setIncomes] = useState<PropertyIncome[]>([]);
    const [summary, setSummary] = useState<IncomeSummary | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [form, setForm] = useState<IncomeFormState>(EMPTY_FORM);
    const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
    const [amountError, setAmountError] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedProperty = useMemo(
        () => properties.find((property) => property.id === selectedPropertyId) ?? null,
        [properties, selectedPropertyId],
    );

    useEffect(() => {
        if (!getAccessToken()) {
            router.replace('/login');
            return;
        }

        let isMounted = true;

        async function loadProperties() {
            setIsLoading(true);
            const response = await getProperties();

            if (!isMounted) {
                return;
            }

            if ('error' in response) {
                if (response.status === 401) {
                    logout();
                    router.replace('/login');
                    return;
                }
                setGeneralError(response.error);
                setIsLoading(false);
                return;
            }

            setProperties(response);
            if (response.length > 0) {
                setSelectedPropertyId(response[0].id);
            }
            setIsLoading(false);
        }

        void loadProperties();
        return () => {
            isMounted = false;
        };
    }, [router]);

    useEffect(() => {
        if (!selectedPropertyId) {
            return;
        }

        let isMounted = true;

        async function loadPropertyFinancials() {
            const [historyResponse, summaryResponse] = await Promise.all([
                getIncomes(selectedPropertyId),
                getIncomeSummary(selectedPropertyId, startDate || undefined, endDate || undefined),
            ]);

            if (!isMounted) {
                return;
            }

            if ('error' in historyResponse) {
                setGeneralError(historyResponse.error);
                return;
            }

            if ('error' in summaryResponse) {
                setGeneralError(summaryResponse.error);
                return;
            }

            setGeneralError(null);
            setIncomes(historyResponse);
            setSummary(summaryResponse);
        }

        void loadPropertyFinancials();
        return () => {
            isMounted = false;
        };
    }, [selectedPropertyId, startDate, endDate]);

    function validateAmount(value: string): string | null {
        const normalized = value.trim().replace(',', '.');
        const parsedValue = Number(normalized);

        if (normalized.length === 0 || Number.isNaN(parsedValue)) {
            return 'El monto debe ser un valor numérico.';
        }

        if (parsedValue < 0) {
            return 'El monto no puede ser negativo.';
        }

        return null;
    }

    function handleEdit(income: PropertyIncome) {
        setEditingIncomeId(income.id);
        setAmountError(null);
        setSuccessMessage(null);
        setForm({
            amount: String(income.amount),
            incomeDate: income.incomeDate,
            incomeType: income.incomeType,
            description: income.description,
        });
    }

    function resetForm() {
        setForm(EMPTY_FORM);
        setEditingIncomeId(null);
        setAmountError(null);
    }

    async function handleDelete(incomeId: string) {
        if (!selectedPropertyId) {
            return;
        }

        const shouldDelete = window.confirm('¿Deseas eliminar este ingreso? Esta acción no se puede deshacer.');
        if (!shouldDelete) {
            return;
        }

        setGeneralError(null);
        setSuccessMessage(null);
        const response = await deleteIncome(selectedPropertyId, incomeId);
        if ('error' in response) {
            setGeneralError(response.error);
            return;
        }

        const [historyResponse, summaryResponse] = await Promise.all([
            getIncomes(selectedPropertyId),
            getIncomeSummary(selectedPropertyId, startDate || undefined, endDate || undefined),
        ]);

        if (!('error' in historyResponse)) {
            setIncomes(historyResponse);
        }
        if (!('error' in summaryResponse)) {
            setSummary(summaryResponse);
        }

        setSuccessMessage('Ingreso eliminado y totales actualizados.');
        if (editingIncomeId === incomeId) {
            resetForm();
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setGeneralError(null);
        setSuccessMessage(null);

        if (!selectedPropertyId) {
            setGeneralError('Selecciona una propiedad para registrar ingresos.');
            return;
        }

        const currentAmountError = validateAmount(form.amount);
        setAmountError(currentAmountError);
        if (currentAmountError) {
            return;
        }

        const payload: IncomePayload = {
            amount: Number(form.amount.replace(',', '.')),
            incomeDate: form.incomeDate,
            incomeType: form.incomeType,
            description: form.description.trim(),
        };

        setIsSubmitting(true);
        const response = editingIncomeId
            ? await updateIncome(selectedPropertyId, editingIncomeId, payload)
            : await createIncome(selectedPropertyId, payload);
        setIsSubmitting(false);

        if ('error' in response) {
            setGeneralError(response.error);
            return;
        }

        const [historyResponse, summaryResponse] = await Promise.all([
            getIncomes(selectedPropertyId),
            getIncomeSummary(selectedPropertyId, startDate || undefined, endDate || undefined),
        ]);

        if (!('error' in historyResponse)) {
            setIncomes(historyResponse);
        }
        if (!('error' in summaryResponse)) {
            setSummary(summaryResponse);
        }

        setSuccessMessage(editingIncomeId ? 'Ingreso actualizado exitosamente.' : 'Ingreso guardado exitosamente.');
        resetForm();
    }

    return (
        <main className="app-shell">
            <section className="panel panel--wide stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">Control financiero</p>
                        <h1 className="title">Ingresos por propiedad</h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            router.push('/login');
                        }}
                        className="btn btn-ghost"
                    >
                        Logout
                    </button>
                </div>

                <p className="subtitle">
                    Registra ingresos de arriendo o venta, revisa el historial cronológico y consulta el total acumulado por
                    rango de fechas.
                </p>

                {isLoading && <p className="alert alert-info">Cargando propiedades...</p>}

                {!isLoading && (
                    <>
                        <div className="field">
                            <label htmlFor="propertyId" className="field-label">
                                Propiedad
                            </label>
                            <select
                                id="propertyId"
                                className="field-input"
                                value={selectedPropertyId}
                                onChange={(event) => setSelectedPropertyId(event.target.value)}
                            >
                                {properties.map((property) => (
                                    <option key={property.id} value={property.id}>
                                        {property.code} - {property.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedProperty && (
                            <p className="info-callout">
                                Trabajando con <strong>{selectedProperty.code}</strong>.
                            </p>
                        )}

                        <div className="income-grid">
                            <article className="income-column">
                                <h2 className="section-title">{editingIncomeId ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
                                <form className="stack stack-lg" onSubmit={handleSubmit}>
                                    <div className="field">
                                        <label htmlFor="amount" className="field-label">
                                            Monto
                                        </label>
                                        <input
                                            id="amount"
                                            type="text"
                                            inputMode="decimal"
                                            value={form.amount}
                                            onChange={(event) => {
                                                setForm((prev) => ({ ...prev, amount: event.target.value }));
                                                setAmountError(null);
                                            }}
                                            required
                                            className="field-input"
                                        />
                                        {amountError && <p className="field-error">{amountError}</p>}
                                    </div>

                                    <div className="field">
                                        <label htmlFor="incomeDate" className="field-label">
                                            Fecha
                                        </label>
                                        <input
                                            id="incomeDate"
                                            type="date"
                                            value={form.incomeDate}
                                            onChange={(event) => setForm((prev) => ({ ...prev, incomeDate: event.target.value }))}
                                            required
                                            className="field-input"
                                        />
                                    </div>

                                    <div className="field">
                                        <label htmlFor="incomeType" className="field-label">
                                            Tipo
                                        </label>
                                        <select
                                            id="incomeType"
                                            value={form.incomeType}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, incomeType: event.target.value as PropertyIncomeType }))
                                            }
                                            className="field-input"
                                        >
                                            <option value="arriendo">Arriendo</option>
                                            <option value="venta">Venta</option>
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label htmlFor="description" className="field-label">
                                            Descripción
                                        </label>
                                        <textarea
                                            id="description"
                                            value={form.description}
                                            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                            required
                                            className="field-input field-input--textarea"
                                        />
                                    </div>

                                    <div className="actions">
                                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                            {isSubmitting
                                                ? 'Guardando...'
                                                : editingIncomeId
                                                  ? 'Guardar cambios'
                                                  : 'Guardar ingreso'}
                                        </button>
                                        {editingIncomeId && (
                                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                                Cancelar edición
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </article>

                            <article className="income-column">
                                <h2 className="section-title">Resumen financiero</h2>
                                <div className="income-filters">
                                    <div className="field">
                                        <label htmlFor="startDate" className="field-label">
                                            Desde
                                        </label>
                                        <input
                                            id="startDate"
                                            type="date"
                                            className="field-input"
                                            value={startDate}
                                            onChange={(event) => setStartDate(event.target.value)}
                                        />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="endDate" className="field-label">
                                            Hasta
                                        </label>
                                        <input
                                            id="endDate"
                                            type="date"
                                            className="field-input"
                                            value={endDate}
                                            onChange={(event) => setEndDate(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="summary-card">
                                    <p className="summary-label">Total acumulado</p>
                                    <p className="summary-total">{formatCurrency(summary?.total ?? 0)}</p>
                                    <p className="summary-meta">{summary?.entries ?? 0} ingresos en el periodo seleccionado</p>
                                </div>
                            </article>
                        </div>

                        <article className="income-history">
                            <h2 className="section-title">Historial cronológico</h2>
                            {incomes.length === 0 ? (
                                <p className="alert alert-info">Aún no hay ingresos registrados para esta propiedad.</p>
                            ) : (
                                <div className="history-list">
                                    {incomes.map((income) => (
                                        <div key={income.id} className="history-row">
                                            <div>
                                                <p className="history-date">{formatDate(income.incomeDate)}</p>
                                                <p className="history-type">
                                                    {income.incomeType === 'arriendo' ? 'Arriendo' : 'Venta'} - {income.description}
                                                </p>
                                            </div>
                                            <div className="history-actions">
                                                <span className="history-amount">{formatCurrency(income.amount)}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => handleEdit(income)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost"
                                                    onClick={() => handleDelete(income.id)}
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    </>
                )}

                {generalError && <p className="alert alert-error">{generalError}</p>}
                {successMessage && <p className="alert alert-info">{successMessage}</p>}

                <div className="footer-links">
                    <Link href="/">Volver al inicio</Link>
                    <Link href="/properties">Propiedades</Link>
                    <Link href="/finanzas">Finanzas</Link>
                    <Link href="/me">Perfil</Link>
                </div>
            </section>
        </main>
    );
}
