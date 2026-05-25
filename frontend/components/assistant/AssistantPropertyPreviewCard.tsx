"use client";

import type { AssistantPropertyPreview } from "@/lib/api/assistant";

const fmtMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: currency === "UF" ? "CLP" : currency,
    maximumFractionDigits: 0,
  }).format(amount);

export function AssistantPropertyPreviewCard({ preview }: { preview: AssistantPropertyPreview }) {
  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
      <p className="font-semibold text-foreground text-sm">{preview.titulo}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
        <div><dt className="inline">Tipo: </dt><dd className="inline text-foreground">{preview.tipo}</dd></div>
        <div><dt className="inline">Arriendo: </dt><dd className="inline text-foreground">{fmtMoney(preview.arriendoMensual, preview.moneda)}</dd></div>
        <div><dt className="inline">Ciudad: </dt><dd className="inline text-foreground">{preview.ciudad}</dd></div>
        <div><dt className="inline">Estado: </dt><dd className="inline text-foreground">{preview.estadoComercial}</dd></div>
        <div className="col-span-2"><dt className="inline">Propietario: </dt><dd className="inline text-foreground">{preview.propietario}</dd></div>
        {preview.direccion && (
          <div className="col-span-2"><dt className="inline">Dirección: </dt><dd className="inline text-foreground">{preview.direccion}</dd></div>
        )}
        {(preview.dormitorios > 0 || preview.banos > 0) && (
          <div className="col-span-2">
            <dt className="inline">Detalle: </dt>
            <dd className="inline text-foreground">{preview.dormitorios} dorm. · {preview.banos} baños</dd>
          </div>
        )}
        <div className="col-span-2 text-[10px] opacity-70">Código propuesto: {preview.codigoPropuesto}</div>
      </dl>
      <p className="text-[10px] text-muted-foreground italic">Vista previa — confirma para crear en tu portafolio.</p>
    </div>
  );
}
