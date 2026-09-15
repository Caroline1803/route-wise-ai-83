import type { MobilityOption } from "@/lib/mobility/types";
import { DataSourceBadge } from "./DataSourceBadge";

const MODAL_ICON: Record<string, string> = {
  RIDE_HAILING: "🚗",
  BUS: "🚌",
  METRO: "🚇",
  TRAIN: "🚆",
  BIKE: "🚲",
  MULTIMODAL: "🔀",
};

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function OptionCard({
  option,
  highlighted = false,
}: {
  option: MobilityOption;
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 transition-shadow ${
        highlighted
          ? "border-primary/40 bg-card shadow-glow"
          : "border-border bg-card hover:shadow-soft"
      } ${option.available ? "" : "opacity-60"}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{MODAL_ICON[option.modal] ?? "🧭"}</span>
          <div>
            <h3 className="font-semibold text-foreground">{option.productName}</h3>
            <p className="text-xs text-muted-foreground">
              {option.provider === "PUBLIC_TRANSPORT" ? "Transporte público" : option.provider}
              {option.transfers ? ` · ${option.transfers} integração` : ""}
              {option.distanceKm ? ` · ${option.distanceKm.toFixed(1)} km` : ""}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">{brl(option.estimatedPrice)}</p>
          <p className="text-xs text-muted-foreground">
            {option.estimatedTimeMinutes} min
            {option.etaMinutes !== undefined ? ` · chega em ${option.etaMinutes} min` : ""}
          </p>
        </div>
      </header>

      {option.segments && option.segments.length > 0 && (
        <ol className="mt-4 space-y-1 border-l-2 border-border pl-4 text-sm text-muted-foreground">
          {option.segments.map((s, i) => (
            <li key={i}>
              {MODAL_ICON[s.modal]} {s.description} — {s.duration} min · {brl(s.price)}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <DataSourceBadge source={option.dataSource} />
        {option.cashback ? (
          <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
            Cashback {brl(option.cashback)}
          </span>
        ) : null}
        <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
          CO₂ {(option.co2Kg ?? 0).toFixed(2)} kg
        </span>
        {option.mobilityScore !== undefined && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
            Score {option.mobilityScore}
          </span>
        )}
        {!option.available && (
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-medium text-destructive">
            Temporariamente indisponível
          </span>
        )}
      </div>

      <p
        className={`mt-3 text-xs ${
          option.corporateEligible ? "text-eco" : "text-warning"
        }`}
      >
        {option.corporateEligible
          ? "Crédito corporativo: SIM"
          : `Crédito corporativo: NÃO — ${option.corporateRestrictionReason ?? "fora da política"}`}
      </p>
    </article>
  );
}
