import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { ACTIVE_CAMPAIGN } from "@/lib/mobility/policy";

export const Route = createFileRoute("/rh")({
  head: () => ({
    meta: [
      { title: "Portal RH — indicadores de mobilidade | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Acompanhe créditos distribuídos e utilizados, gastos por modal, cashback, economia e indicadores ambientais da sua empresa.",
      },
      { property: "og:title", content: "Portal RH — MaaS Corporate AI" },
      {
        property: "og:description",
        content: "Indicadores de mobilidade corporativa e insights da MaaS Intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalRh,
});

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Indicadores de demonstração do MVP (dados simulados). */
const KPIS = [
  { label: "Créditos distribuídos", value: brl(184_000) },
  { label: "Créditos utilizados", value: brl(127_430) },
  { label: "Cashback devolvido", value: brl(4_812) },
  { label: "Economia estimada", value: brl(23_900) },
];

const BY_MODAL = [
  { modal: "Metrô", spend: 41_200, share: 32 },
  { modal: "Ônibus", spend: 22_800, share: 18 },
  { modal: "Carro por app", spend: 46_100, share: 36 },
  { modal: "Bicicleta", spend: 8_930, share: 7 },
  { modal: "Trem", spend: 8_400, share: 7 },
];

const TOP_EMPLOYEES = [
  { name: "Ana Ribeiro", spend: 612.4, trips: 38 },
  { name: "Carlos Menezes", spend: 548.9, trips: 31 },
  { name: "Juliana Prado", spend: 501.3, trips: 44 },
  { name: "Rafael Souza", spend: 476.8, trips: 26 },
];

const INSIGHTS = [
  "38% das viagens corporativas utilizaram transporte coletivo.",
  "A empresa poderia economizar R$ 18.500/mês incentivando alternativas multimodais em determinados trajetos.",
  "O uso de bicicletas cresceu 12% após a campanha de cashback.",
];

function PortalRh() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground">Portal RH</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visão consolidada do programa de mobilidade corporativa. Números de
          demonstração do MVP.
        </p>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">Gastos por modal</h2>
            <ul className="mt-4 space-y-3">
              {BY_MODAL.map((m) => (
                <li key={m.modal}>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{m.modal}</span>
                    <span className="text-muted-foreground">
                      {brl(m.spend)} · {m.share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-brand-gradient"
                      style={{ width: `${m.share * 2.6}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Gasto por colaborador
            </h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Colaborador</th>
                  <th className="pb-2 font-medium">Viagens</th>
                  <th className="pb-2 text-right font-medium">Gasto</th>
                </tr>
              </thead>
              <tbody>
                {TOP_EMPLOYEES.map((e) => (
                  <tr key={e.name} className="border-t border-border">
                    <td className="py-2 text-foreground">{e.name}</td>
                    <td className="py-2 text-muted-foreground">{e.trips}</td>
                    <td className="py-2 text-right text-foreground">{brl(e.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">
              Sustentabilidade e mobilidade compartilhada
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Transporte público</dt>
                <dd className="text-xl font-bold text-eco">57%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mobilidade compartilhada</dt>
                <dd className="text-xl font-bold text-eco">14%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">CO₂ evitado</dt>
                <dd className="text-xl font-bold text-eco">6,2 t</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Viagens no mês</dt>
                <dd className="text-xl font-bold text-foreground">4.318</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-accent/40 p-3 text-xs text-accent-foreground">
              Campanha ativa: <strong>{ACTIVE_CAMPAIGN.name}</strong> —{" "}
              {ACTIVE_CAMPAIGN.description}
            </p>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold text-foreground">
              ✨ MaaS Intelligence
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {INSIGHTS.map((i) => (
                <li key={i} className="rounded-xl bg-secondary p-3 text-secondary-foreground">
                  {i}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
