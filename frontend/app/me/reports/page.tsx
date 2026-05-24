'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
    getIncomesSummary, 
    getAvailableProperties, 
    getGlobalExpenses, 
    MonthlyIncomesSummary, 
    AvailableProperty, 
    GlobalExpense 
} from '../../lib/reports';

type ReportType = 'incomes' | 'availability' | 'expenses';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportType>('incomes');
    const [incomesData, setIncomesData] = useState<MonthlyIncomesSummary | null>(null);
    const [availabilityData, setAvailabilityData] = useState<AvailableProperty[]>([]);
    const [expensesData, setExpensesData] = useState<GlobalExpense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters for expenses
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoading(true);
            setError(null);
            
            try {
                if (activeTab === 'incomes') {
                    const res = await getIncomesSummary();
                    if (isMounted) {
                        if ('error' in res) setError(res.error);
                        else setIncomesData(res);
                    }
                } else if (activeTab === 'availability') {
                    const res = await getAvailableProperties();
                    if (isMounted) {
                        if ('error' in res) setError(res.error);
                        else setAvailabilityData(res);
                    }
                } else if (activeTab === 'expenses') {
                    const res = await getGlobalExpenses(startDate, endDate);
                    if (isMounted) {
                        if ('error' in res) setError(res.error);
                        else setExpensesData(res);
                    }
                }
            } catch {
                if (isMounted) setError('Error inesperado al cargar datos');
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        void loadData();

        return () => {
            isMounted = false;
        };
    }, [activeTab, startDate, endDate]);

    const handleFilterExpenses = useCallback(() => {
        // Al cambiar startDate o endDate, el useEffect ya se dispara.
        // Este botón puede servir para forzar un refresco si fuera necesario,
        // pero con las dependencias en useEffect ya es reactivo.
    }, []);

    function exportToExcel() {
        let dataToExport: Record<string, unknown>[] = [];
        let fileName = 'reporte.xlsx';

        if (activeTab === 'incomes' && incomesData) {
            dataToExport = [
                { Concepto: 'Mes Actual', Monto: incomesData.currentMonth },
                { Concepto: 'Mes Anterior', Monto: incomesData.previousMonth },
                { Concepto: 'Diferencia', Monto: incomesData.diff }
            ];
            fileName = 'reporte_ingresos.xlsx';
        } else if (activeTab === 'availability') {
            dataToExport = availabilityData.map(p => ({
                Codigo: p.code,
                Titulo: p.title,
                Tipo: p.propertyType,
                Precio: p.rentalDetail?.monthlyRent || 'N/A',
                Moneda: p.rentalDetail?.currency || '',
                Disponibilidad: p.availableDate || 'Inmediata'
            }));
            fileName = 'reporte_disponibilidad.xlsx';
        } else if (activeTab === 'expenses') {
            dataToExport = expensesData.map(e => ({
                Propiedad: e.property,
                Categoria: e.category,
                Total: e.total
            }));
            fileName = 'reporte_gastos.xlsx';
        }

        if (dataToExport.length === 0) return;

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        XLSX.writeFile(workbook, fileName);
    }

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    return (
        <main className="app-shell">
            <section className="panel panel--wide stagger">
                <div className="top-row">
                    <div>
                        <p className="kicker">Administración</p>
                        <h1 className="title">Reportes de Gestión</h1>
                    </div>
                    <div className="actions">
                        <button
                            type="button"
                            onClick={exportToExcel}
                            className="btn btn-primary btn--compact"
                            disabled={loading}
                        >
                            Exportar Excel
                        </button>
                        <Link href="/me" className="btn btn-ghost btn--compact">
                            Volver
                        </Link>
                    </div>
                </div>

                <div className="chip-row">
                    <button
                        type="button"
                        onClick={() => setActiveTab('incomes')}
                        className={`chip ${activeTab === 'incomes' ? 'btn-primary' : ''}`}
                    >
                        Ingresos Mensuales
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('availability')}
                        className={`chip ${activeTab === 'availability' ? 'btn-primary' : ''}`}
                    >
                        Propiedades Disponibles
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('expenses')}
                        className={`chip ${activeTab === 'expenses' ? 'btn-primary' : ''}`}
                    >
                        Gastos por Propiedad
                    </button>
                </div>

                {error && <p className="alert alert-error">{error}</p>}
                {loading && <p className="alert alert-info">Cargando datos...</p>}

                <div className="report-block">
                    {!loading && activeTab === 'incomes' && incomesData && (
                        <div className="balance-strip">
                            <div className="balance-card">
                                <p className="summary-label">Mes Actual</p>
                                <p className="balance-hero balance-hero--pos">{formatCurrency(incomesData.currentMonth)}</p>
                            </div>
                            <div className="balance-card">
                                <p className="summary-label">Mes Anterior</p>
                                <p className="balance-hero">{formatCurrency(incomesData.previousMonth)}</p>
                            </div>
                            <div className="balance-card">
                                <p className="summary-label">Diferencia</p>
                                <p className={`balance-hero ${incomesData.diff >= 0 ? 'balance-hero--pos' : 'balance-hero--neg'}`}>
                                    {formatCurrency(incomesData.diff)}
                                </p>
                            </div>
                        </div>
                    )}

                    {!loading && activeTab === 'availability' && (
                        <div className="table-scroll">
                            {availabilityData.length > 0 ? (
                                <table className="property-table">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Título</th>
                                            <th>Tipo</th>
                                            <th>Precio</th>
                                            <th>Disponibilidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availabilityData.map(p => (
                                            <tr key={p.id}>
                                                <td className="mono">{p.code}</td>
                                                <td>{p.title}</td>
                                                <td>{p.propertyType}</td>
                                                <td className="mono">{p.rentalDetail ? `${formatCurrency(Number(p.rentalDetail.monthlyRent))} ${p.rentalDetail.currency}` : 'N/A'}</td>
                                                <td>{p.availableDate || 'Inmediata'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="info-callout">No hay propiedades disponibles registradas.</p>
                            )}
                        </div>
                    )}

                    {!loading && activeTab === 'expenses' && (
                        <div className="stack">
                            <div className="income-filters">
                                <div className="field">
                                    <label className="field-label" htmlFor="report-start-date">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        id="report-start-date"
                                        type="date"
                                        className="field-input"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="field">
                                    <label className="field-label" htmlFor="report-end-date">
                                        Fecha Fin
                                    </label>
                                    <input
                                        id="report-end-date"
                                        type="date"
                                        className="field-input"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button type="button" onClick={handleFilterExpenses} className="btn btn-secondary">
                                Filtrar Gastos
                            </button>
                            
                            <div className="table-scroll report-block">
                                {expensesData.length > 0 ? (
                                    <table className="property-table">
                                        <thead>
                                            <tr>
                                                <th>Propiedad</th>
                                                <th>Categoría</th>
                                                <th>Total Gastado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expensesData.map((e, idx) => (
                                                <tr key={idx}>
                                                    <td>{e.property}</td>
                                                    <td>{e.category}</td>
                                                    <td className="mono balance-hero--neg">{formatCurrency(e.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="info-callout">No hay registros de gastos para el período seleccionado.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
