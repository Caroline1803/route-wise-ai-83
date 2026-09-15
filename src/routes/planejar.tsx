import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { OptionCard } from "@/components/mobility/OptionCard";
import { searchMobility } from "@/lib/mobility/search.functions";
import { PLACES } from "@/lib/mobility/places";
import type { MobilityOption, SearchResponse } from "@/lib/mobility/types";

export const Route = createFileRoute("/planejar")({
  head: () => ({
    meta: [
      { title: "Planejar viagem multimodal | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Informe origem e destino e compare metrô, ônibus, trem, bicicleta e carro por app com preço, tempo, cashback e política da empresa.",
      },
      { property: "og:title", content: "Planejar viagem multimodal" },
      {
        property: "og:description",
        content: "Compare todas as opções de mobilidade em uma única busca.",
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
  const [originIdx, setOriginIdx] = useState(1);
  const [destIdx, setDestIdx] = useState(3);
  const [filter, setFilter] = useState<FilterKey>("BEST");

  const mutation = useMutation<SearchResponse>({
    mutationFn: async () => {
      const origin = PLACES[originIdx]!;
      const destination = PLACES[destIdx]!;
      return search({
        data: {
          origin: { latitude: origin.latitude, longitude: origin.longitude },
          destination: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          hourOfDay: new Date().getHours(),
        },
      });
    },
  });

  const data = mutation.data;
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
          Escolha o trajeto e veja todas as alternativas de mobilidade em uma só tela.
        </p>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-foreground">
                De onde você está saindo?
              </span>
              <select
                value={originIdx}
                onChange={(e) => setOriginIdx(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {PLACES.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-foreground">Para onde você vai?</span>
              <select
                value={destIdx}
                onChange={(e) => setDestIdx(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {PLACES.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || originIdx === destIdx}
            className="mt-5 w-full rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {mutation.isPending ? "Buscando opções…" : "Buscar opções"}
          </button>
          {originIdx === destIdx && (
            <p className="mt-2 text-center text-xs text-warning">
              Escolha uma origem diferente do destino.
            </p>
          )}
        </section>

        {mutation.isError && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível buscar as opções agora. Tente novamente.
          </p>
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
              <section className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-foreground">
                  ✨ Recomendado pela MaaS AI
                </h2>
                <OptionCard option={data.recommended} highlighted />
                <p className="mt-3 rounded-xl border border-border bg-accent/40 p-4 text-sm text-accent-foreground">
                  <strong className="font-semibold">MaaS AI:</strong> {data.explanation}
                </p>
              </section>
            )}

            <section className="mt-8 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Demais opções</h2>
              {rest.map((o) => (
                <OptionCard key={o.id} option={o} />
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
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
