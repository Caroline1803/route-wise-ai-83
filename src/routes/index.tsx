import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/mobility/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MaaS Corporate AI — Mobilidade corporativa inteligente" },
      {
        name: "description",
        content:
          "Uma única carteira digital para transporte público, bicicletas e carros por app, com recomendação inteligente e política corporativa aplicada.",
      },
      { property: "og:title", content: "MaaS Corporate AI" },
      {
        property: "og:description",
        content:
          "Planeje viagens multimodais com créditos corporativos, cashback e indicadores de sustentabilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const HIGHLIGHTS = [
  {
    icon: "🚇",
    title: "Multimodal de verdade",
    text: "Ônibus, metrô, trem, bicicleta e carro por app comparados lado a lado.",
  },
  {
    icon: "✨",
    title: "Recomendação MaaS AI",
    text: "Score de 0 a 100 considerando preço, tempo, CO₂, política e cashback.",
  },
  {
    icon: "💳",
    title: "Carteira corporativa",
    text: "Saldo, limite mensal e regras da empresa validados antes de recomendar.",
  },
  {
    icon: "🌱",
    title: "Impacto ambiental",
    text: "Emissão estimada por trajeto e incentivo a modais sustentáveis.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20">
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            Plataforma de mobilidade como serviço
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold text-foreground sm:text-6xl">
            Uma carteira. Todas as formas de chegar.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Sua empresa distribui créditos de mobilidade e a MaaS AI encontra o melhor
            trajeto para cada deslocamento, equilibrando custo, tempo e sustentabilidade.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/planejar"
              className="rounded-xl bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Planejar uma viagem
            </Link>
            <Link
              to="/rh"
              className="rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Ver portal do RH
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="text-2xl">{h.icon}</span>
              <h2 className="mt-3 text-base font-semibold text-foreground">{h.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        MaaS Corporate AI · dados de provedores exibidos sempre com sua origem
        (tempo real, sandbox ou simulação).
      </footer>
    </div>
  );
}
