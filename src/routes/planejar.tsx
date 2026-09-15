import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { OptionCard } from "@/components/mobility/OptionCard";
import { MobilityRecommendation } from "@/components/mobility/MobilityRecommendation";
import { AddressAutocomplete } from "@/components/maps/AddressAutocomplete";
import { CurrentLocationButton } from "@/components/maps/CurrentLocationButton";
import { RouteMap } from "@/components/maps/RouteMap";
import { RouteSummary } from "@/components/maps/RouteSummary";
import { searchMobility } from "@/lib/mobility/search.functions";
import { computeRoute } from "@/lib/maps/maps.functions";
import type { MobilityOption, Modal, SearchResponse } from "@/lib/mobility/types";
import type { RouteResult, SelectedPlace, TravelMode } from "@/lib/maps/types";

export const Route = createFileRoute("/planejar")({
  head: () => ({
    meta: [
      { title: "Planejar viagem multimodal | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Busque endereços reais no mapa e compare metrô, ônibus, trem, bicicleta e carro por app com preço, tempo, cashback e política da empresa.",
      },
      { property: "og:title", content: "Planejar viagem multimodal" },
      {
        property: "og:description",
        content: "Endereços e rotas reais combinados com todas as opções de mobilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planejar,
});

type FilterKey = "BEST" | "FASTEST" | "CHEAPEST" | "GREENEST" | "CASHBACK";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "BEST", label: "Melhor opção" },
  { key: "FASTEST", label: "Mais rápido" },
  { key: "CHEAPEST", label: "Mais barato" },
  { key: "GREENEST", label: "Mais sustentável" },
  { key: "CASHBACK", label: "Maior cashback" },
];

const STEPS = [
  "Localizando origem e destino",
  "Calculando rota no Google Maps",
  "Consultando opções de mobilidade",
  "Aplicando política corporativa",
  "Calculando recomendação",
];

const MODE_BY_MODAL: Record<Modal, TravelMode> = {
  RIDE_HAILING: "DRIVE",
  BUS: "TRANSIT",
  METRO: "TRANSIT",
  TRAIN: "TRANSIT",
  BIKE: "BICYCLE",
  MULTIMODAL: "TRANSIT",
};

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function sortOptions(options: MobilityOption[], filter: FilterKey) {
  const copy = [...options];
  switch (filter) {
    case "FASTEST":
      return copy.sort((a, b) => a.estimatedTimeMinutes - b.estimatedTimeMinutes);
    case "CHEAPEST":
      return copy.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
    case "GREENEST":
      return copy.sort((a, b) => (a.co2Kg ?? 0) - (b.co2Kg ?? 0));
    case "CASHBACK":
      return copy.sort((a, b) => (b.cashback ?? 0) - (a.cashback ?? 0));
    default:
      return copy.sort((a, b) => (b.mobilityScore ?? 0) - (a.mobilityScore ?? 0));
  }
}

function Planejar() {
  const search = useServerFn(searchMobility);
  const route = useServerFn(computeRoute);

  const [origin, setOrigin] = useState<SelectedPlace | null>(null);
  const [destination, setDestination] = useState<SelectedPlace | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [filter, setFilter] = useState<FilterKey>("BEST");
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optionPolyline, setOptionPolyline] = useState<string | null>(null);

  const loading = loadingStep >= 0;

  const handleSearch = async () => {
    if (!origin || !destination) return;
    setError(null);
    setData(null);
    setSelectedId(null);
    setOptionPolyline(null);
    setLoadingStep(0);
    try {
      setLoadingStep(1);
      const real = await route({ data: { origin, destination, travelMode: "DRIVE" } });
      setRouteResult(real);

      setLoadingStep(2);
      const response = await search({
        data: {
          origin: {
            latitude: origin.latitude,
            longitude: origin.longitude,
            label: origin.formattedAddress,
          },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
            label: destination.formattedAddress,
          },
          hourOfDay: new Date().getHours(),
        },
      });
      setLoadingStep(4);
      setData(response);
      setSelectedId(response.recommended?.id ?? null);
    } catch (e) {
      setError(
        (e as Error).message ||
          "Não conseguimos calcular essa viagem agora. Verifique os endereços e tente novamente.",
      );
    } finally {
      setLoadingStep(-1);
    }
  };

  const selectedOption = useMemo(
    () => data?.options.find((o) => o.id === selectedId) ?? null,
    [data, selectedId],
  );

  /** Ao escolher uma opção, o mapa mostra o trajeto real daquele modal. */
  const loadOptionPath = useCallback(
    async (option: MobilityOption) => {
      if (!origin || !destination) return;
      try {
        const result = await route({
          data: { origin, destination, travelMode: MODE_BY_MODAL[option.modal] },
        });
        setOptionPolyline(result.encodedPolyline ?? null);
      } catch {
        setOptionPolyline(routeResult?.encodedPolyline ?? null);
      }
    },
    [origin, destination, route, routeResult],
  );

  useEffect(() => {
    if (selectedOption) void loadOptionPath(selectedOption);
  }, [selectedOption, loadOptionPath]);

  const paths = useMemo(() => {
    const encoded = optionPolyline ?? routeResult?.encodedPolyline;
    return encoded ? [{ encodedPolyline: encoded, color: "#0d9488" }] : [];
  }, [optionPolyline, routeResult]);

  const sorted = useMemo(
    () => (data ? sortOptions(data.options, filter) : []),
    [data, filter],
  );
  const rest = sorted.filter((o) => o.id !== data?.recommended?.id);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">Planejar viagem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe endereços reais, veja o percurso no mapa e compare todas as alternativas
          de mobilidade.
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AddressAutocomplete
                label="De onde você está saindo?"
                value={origin}
                onSelect={setOrigin}
                onError={setError}
              />
              <CurrentLocationButton onLocated={setOrigin} onError={setError} />
            </div>
            <AddressAutocomplete
              label="Para onde você vai?"
              value={destination}
              onSelect={setDestination}
              onError={setError}
            />
          </div>

          <button
            onClick={() => void handleSearch()}
            disabled={loading || !origin || !destination}
            className="mt-5 w-full rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? "Buscando as melhores opções para você…" : "Buscar opções"}
          </button>

          {loading && (
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= loadingStep ? "text-eco" : ""}>
                  {i <= loadingStep ? "✓" : "•"} {s}
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <section className="mt-6">
          <RouteMap origin={origin} destination={destination} paths={paths} />
        </section>

        {routeResult && (
          <div className="mt-6">
            <RouteSummary route={routeResult} />
          </div>
        )}

        {data && (
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      filter === f.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Saldo: {brl(data.wallet.balance)} · limite mensal restante{" "}
                {brl(data.wallet.policy.monthlyLimit - data.wallet.policy.monthlyUsed)}
              </span>
            </div>

            {data.recommended && (
              <div className="mt-6">
                <MobilityRecommendation
                  option={data.recommended}
                  explanation={data.explanation}
                  selected={selectedId === data.recommended.id}
                  onSelect={() => setSelectedId(data.recommended!.id)}
                />
              </div>
            )}

            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Demais opções</h2>
              {rest.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className="block w-full text-left"
                >
                  <OptionCard option={o} selected={selectedId === o.id} />
                </button>
              ))}
            </section>

            <section className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Status dos provedores
              </h2>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {data.providers.map((p) => (
                  <li key={p.provider}>
                    {p.healthy ? "🟢" : "🔴"} {p.provider} — {p.dataSource}
                    {p.message ? ` · ${p.message}` : ""}
                  </li>
                ))}
                <li>🟢 GOOGLE_MAPS — LIVE · endereços, distância e rota reais</li>
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
