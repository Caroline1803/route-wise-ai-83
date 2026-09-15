import type { DataSource } from "@/lib/mobility/types";

const LABELS: Record<DataSource, string> = {
  LIVE: "DADO EM TEMPO REAL",
  SANDBOX: "DADO DE SANDBOX",
  MOCK: "SIMULAÇÃO DO MVP",
};

const STYLES: Record<DataSource, string> = {
  LIVE: "bg-eco/15 text-eco border-eco/30",
  SANDBOX: "bg-warning/15 text-warning border-warning/30",
  MOCK: "bg-muted text-muted-foreground border-border",
};

export function DataSourceBadge({ source }: { source: DataSource }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${STYLES[source]}`}
    >
      {LABELS[source]}
    </span>
  );
}
