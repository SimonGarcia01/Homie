'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
    CreateExpensePayload,
    ExpenseReport,
    PropertyBalance,
    PropertyExpenseCategory,
    PropertyExpenseRow,
    createExpense,
    deleteExpense,
    getBalance,
    getExpenseReport,
    getExpenses,
} from '../lib/finanzas';
import { getAccessToken, logout } from '../lib/auth';
import { getProperties, PropertyOption, downloadPropertyRecordsPdf } from '../lib/properties';

const CATEGORY_OPTIONS: { value: PropertyExpenseCategory; label: string }[] = [
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'impuesto', label: 'Impuesto' },
    { value: 'servicio', label: 'Servicio (servicios publicos, etc.)' },
];

function formatCop(value: number) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDate(d: string) {
    const parsed = new Date(`${d}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('es-CO');
}

function categoryLabel(c: PropertyExpenseCategory) {
    return CATEGORY_OPTIONS.find((x) => x.value === c)?.label ?? c;
}

async function fetchFinancesBundle(
    propertyId: string,
    periodStart: string | undefined,
    periodEnd: string | undefined,
) {
    return Promise.all([
        getBalance(propertyId, periodStart, periodEnd),
        getExpenseReport(propertyId, periodStart, periodEnd),
        getExpenses(propertyId),
    ]);
}

function applyFinanceResults(
    b: Awaited<ReturnType<typeof getBalance>>,
    r: Awaited<ReturnType<typeof getExpenseReport>>,
    e: Awaited<ReturnType<typeof getExpenses>>,
    setError: (v: string | null) => void,
    setBalance: (v: PropertyBalance) => void,
    setReport: (v: ExpenseReport) => void,
    setExpenses: (v: PropertyExpenseRow[]) => void,
): void {
    if ('error' in b) {
        setError(b.error);
        return;
    }
    if ('error' in r) {
        setError(r.error);
        return;
    }
    if ('error' in e) {
        setError(e.error);
        return;
    }
    setBalance(b);
    setReport(r);
    setExpenses(e);
    setError(null);
}

export default function FinanzasPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<PropertyOption[]>([]);
    const [propertyId, setPropertyId] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    const [balance, setBalance] = useState<PropertyBalance | null>(null);
    const [report, setReport] = useState<ExpenseReport | null>(null);
    const [expenses, setExpenses] = useState<PropertyExpenseRow[]>([]);

    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [expenseCategory, setExpenseCategory] = useState<PropertyExpenseCategory>('mantenimiento');
    const [description, setDescription] = useState('');

    const [amountError, setAmountError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfBusy, setPdfBusy] = useState(false);

    const periodLabel = useMemo(() => {
        if (!periodStart && !periodEnd) return 'Todo el historial';
        return `${periodStart || '…'} → ${periodEnd || '…'}`;
    }, [periodStart, periodEnd]);

    const refreshFinances = useCallback(async () => {
        if (!propertyId) return;
        const [b, r, e] = await fetchFinancesBundle(
            propertyId,
            periodStart || undefined,
            periodEnd || undefined,
        );
        applyFinanceResults(b, r, e, setError, setBalance, setReport, setExpenses);
    }, [propertyId, periodStart, periodEnd]);

    useEffect(() => {
        if (!getAccessToken()) {
            router.replace('/login');
            return;
        }
        let alive = true;
        (async () => {
            const res = await getProperties();
            if (!alive) return;
            if ('error' in res) {
                if (res.status === 401) {
                    logout();
                    router.replace('/login');
                    return;
                }
                setError(res.error);
                setLoading(false);
                return;
            }
            setProperties(res);
            if (res.length > 0) {
                setPropertyId((prev) => prev || res[0].id);
            }
            setLoading(false);
        })();
        return () => {
            alive = false;
        };
    }, [router]);

    useEffect(() => {
        if (!propertyId) return;
        let cancelled = false;
        fetchFinancesBundle(propertyId, periodStart || undefined, periodEnd || undefined).then(
            ([b, r, e]) => {
                if (cancelled) return;
                applyFinanceResults(b, r, e, setError, setBalance, setReport, setExpenses);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [propertyId, periodStart, periodEnd]);

    function validateAmount(value: string): string | null {
        const normalized = value.trim().replace(',', '.');
        const n = Number(normalized);
        if (normalized === '' || Number.isNaN(n)) return 'El monto debe ser numerico.';
        if (n < 0) return 'El monto no puede ser negativo.';
        return null;
    }

    async function handleExpenseSubmit(ev: FormEvent) {
        ev.preventDefault();
        setError(null);
        setSuccess(null);
        const err = validateAmount(amount);
        setAmountError(err);
        if (err || !propertyId) return;
        if (!description.trim()) {
            setError('La descripcion es obligatoria.');
            return;
        }
        setSubmitting(true);
        const payload: CreateExpensePayload = {
            amount: Number(amount.replace(',', '.')),
            expenseDate,
            expenseCategory,
            description: description.trim(),
        };
        const res = await createExpense(propertyId, payload);
        setSubmitting(false);
        if ('error' in res) {
            setError(res.error);
            return;
        }
        setSuccess('Gasto guardado. Balance y reporte actualizados.');
        setAmount('');
        setDescription('');
        await refreshFinances();
    }

    async function handleDeleteExpense(id: string) {
        if (!propertyId) return;
        if (!window.confirm('¿Eliminar este gasto? El balance se actualizara de inmediato.')) return;
        setError(null);
        const res = await deleteExpense(propertyId, id);
        if ('error' in res) {
            setError(res.error);
            return;
        }
        setSuccess('Gasto eliminado.');
        await refreshFinances();
    }

    async function handlePdf() {
        if (!propertyId) return;
        setPdfBusy(true);
        setError(null);
        const res = await downloadPropertyRecordsPdf(
            propertyId,
            periodStart || undefined,
            periodEnd || undefined,
        );
        setPdfBusy(false);
        if (res !== true) setError(res.error);
    }

    return (
        <main className="app-shell">
            <section className="panel panel--wide stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">Decisiones informadas</p>
                        <h1 className="title">Finanzas por propiedad</h1>
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
                    Registra gastos por categoria, consulta el balance (ingresos menos gastos) y genera reportes agrupados y PDF
                    para un periodo.
                </p>

                {loading && <p className="alert alert-info">Cargando...</p>}

                {!loading && properties.length === 0 && (
                    <p className="alert alert-error">
                        No hay propiedades en tu organizacion. Crea una en la seccion Propiedades o ejecuta el seed del backend.
                    </p>
                )}

                {!loading && properties.length > 0 && (
                    <>
                        <div className="income-filters finanza-filters">
                            <div className="field">
                                <label className="field-label" htmlFor="prop">
                                    Propiedad
                                </label>
                                <select
                                    id="prop"
                                    className="field-input"
                                    value={propertyId}
                                    onChange={(ev) => setPropertyId(ev.target.value)}
                                >
                                    {properties.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.code} — {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="pStart">
                                    Periodo desde
                                </label>
                                <input
                                    id="pStart"
                                    type="date"
                                    className="field-input"
                                    value={periodStart}
                                    onChange={(ev) => setPeriodStart(ev.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label className="field-label" htmlFor="pEnd">
                                    Periodo hasta
                                </label>
                                <input
                                    id="pEnd"
                                    type="date"
                                    className="field-input"
                                    value={periodEnd}
                                    onChange={(ev) => setPeriodEnd(ev.target.value)}
                                />
                            </div>
                        </div>

                        {balance && (
                            <div className="balance-strip">
                                <div className="balance-card">
                                    <p className="summary-label">Balance ({periodLabel})</p>
                                    <p className={`balance-hero ${balance.balance >= 0 ? 'balance-hero--pos' : 'balance-hero--neg'}`}>
                                        {formatCop(balance.balance)}
                                    </p>
                                    <p className="balance-detail">
                                        Ingresos: {formatCop(balance.totalIncomes)} ({balance.incomeCount} mov.) · Gastos:{' '}
                                        {formatCop(balance.totalExpenses)} ({balance.expenseCount} mov.)
                                    </p>
                                </div>
                                <button type="button" className="btn btn-secondary" disabled={pdfBusy || !propertyId} onClick={handlePdf}>
                                    {pdfBusy ? 'Generando PDF...' : 'Descargar PDF (reporte completo)'}
                                </button>
                            </div>
                        )}

                        <div className="property-layout finanza-layout">
                            <article className="income-column">
                                <h2 className="section-title">Nuevo gasto</h2>
                                <p className="finanza-hint">
                                    Elige una categoria predefinida y describe el gasto con tu propio texto (proveedor, factura,
                                    etc.).
                                </p>
                                <form className="stack stack-lg" onSubmit={handleExpenseSubmit}>
                                    <div className="field">
                                        <label className="field-label" htmlFor="gAmount">
                                            Monto
                                        </label>
                                        <input
                                            id="gAmount"
                                            className="field-input"
                                            inputMode="decimal"
                                            value={amount}
                                            onChange={(ev) => {
                                                setAmount(ev.target.value);
                                                setAmountError(null);
                                            }}
                                            required
                                        />
                                        {amountError && <p className="field-error">{amountError}</p>}
                                    </div>
                                    <div className="field">
                                        <label className="field-label" htmlFor="gDate">
                                            Fecha
                                        </label>
                                        <input
                                            id="gDate"
                                            type="date"
                                            className="field-input"
                                            value={expenseDate}
                                            onChange={(ev) => setExpenseDate(ev.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="field">
                                        <label className="field-label" htmlFor="gCat">
                                            Categoria
                                        </label>
                                        <select
                                            id="gCat"
                                            className="field-input"
                                            value={expenseCategory}
                                            onChange={(ev) => setExpenseCategory(ev.target.value as PropertyExpenseCategory)}
                                        >
                                            {CATEGORY_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label className="field-label" htmlFor="gDesc">
                                            Descripcion (detalle libre)
                                        </label>
                                        <textarea
                                            id="gDesc"
                                            className="field-input field-input--textarea"
                                            value={description}
                                            onChange={(ev) => setDescription(ev.target.value)}
                                            required
                                            placeholder="Ej. Predial 2026 - liquidacion abril"
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" disabled={submitting || !propertyId}>
                                        {submitting ? 'Guardando...' : 'Guardar gasto'}
                                    </button>
                                </form>
                            </article>

                            <article className="income-column">
                                <h2 className="section-title">Gastos registrados</h2>
                                {expenses.length === 0 ? (
                                    <p className="alert alert-info">Aun no hay gastos para esta propiedad.</p>
                                ) : (
                                    <div className="table-scroll">
                                        <table className="property-table">
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Categoria</th>
                                                    <th>Monto</th>
                                                    <th>Descripcion</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...expenses]
                                                    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
                                                    .map((row) => (
                                                        <tr key={row.id}>
                                                            <td>{formatDate(row.expenseDate)}</td>
                                                            <td>{categoryLabel(row.expenseCategory)}</td>
                                                            <td>{formatCop(row.amount)}</td>
                                                            <td className="desc-cell">{row.description}</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-ghost btn--compact"
                                                                    onClick={() => handleDeleteExpense(row.id)}
                                                                >
                                                                    Eliminar
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

                        {report && propertyId && (
                            <article className="income-column report-block">
                                <h2 className="section-title">Reporte por categoria ({periodLabel})</h2>
                                {report.categories.length === 0 ? (
                                    <p className="alert alert-info">No hay gastos en este periodo para agrupar.</p>
                                ) : (
                                    <div className="report-cats">
                                        {report.categories.map((cat) => (
                                            <div key={cat.category} className="report-cat-card">
                                                <div className="report-cat-head">
                                                    <strong>{categoryLabel(cat.category)}</strong>
                                                    <span className="report-sub">{formatCop(cat.subtotal)}</span>
                                                </div>
                                                <p className="report-meta">{cat.count} movimiento(s)</p>
                                                <ul className="report-items">
                                                    {cat.items.map((it) => (
                                                        <li key={it.id}>
                                                            <span>{formatDate(it.expenseDate)}</span> · {formatCop(it.amount)} ·{' '}
                                                            {it.description}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        )}
                    </>
                )}

                {error && <p className="alert alert-error">{error}</p>}
                {success && <p className="alert alert-info">{success}</p>}

                <div className="footer-links">
                    <Link href="/">Inicio</Link>
                    <Link href="/incomes">Ingresos</Link>
                    <Link href="/properties">Propiedades</Link>
                    <Link href="/me">Perfil</Link>
                </div>
            </section>
        </main>
    );
}
