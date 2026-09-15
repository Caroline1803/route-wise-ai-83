import type { RouteResult } from "@/lib/maps/types";

/** Resumo da viagem com dados reais do Google Maps. */
export function RouteSummary({ route }: { route: RouteResult }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-sm font-semibold text-muted-foreground">Sua viagem</h2>
      <p className="mt-1 text-base font-semibold text-foreground">
        {route.origin.formattedAddress} → {route.destination.formattedAddress}
      </p>
      <div className="mt-3 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Distância</p>
          <p className="text-lg font-bold text-foreground">
            {route.distanceKm.toFixed(1).replace(".", ",")} km
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Duração de referência</p>
          <p className="text-lg font-bold text-foreground">{route.durationMinutes} min</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Origem do dado</p>
          <p className="text-lg font-bold text-eco">Google Maps</p>
        </div>
      </div>

      {route.steps && route.steps.length > 0 && (
        <ol className="mt-4 space-y-1 border-l-2 border-border pl-4 text-sm text-muted-foreground">
          {route.steps.map((s, i) => (
            <li key={i}>
              {s.mode === "WALK" ? "🚶" : "🚇"} {s.description}
              {s.departureStop ? ` · embarque em ${s.departureStop}` : ""}
              {s.arrivalStop ? ` · desembarque em ${s.arrivalStop}` : ""}
              {s.departureTime ? ` · sai ${s.departureTime}` : ""} — {s.durationMinutes} min
              {s.distanceKm ? ` · ${s.distanceKm.toFixed(1)} km` : ""}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
