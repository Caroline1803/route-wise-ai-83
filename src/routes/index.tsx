import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { Bike, BusFront, CarFront, Leaf, Sparkles, Wallet } from "lucide-react";
import mobilityCity from "@/assets/mobility-city-night.jpg";

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
    icon: BusFront,
    title: "Multimodal de verdade",
    text: "Ônibus, metrô, trem, bicicleta e carro por app comparados lado a lado.",
  },
  {
    icon: Sparkles,
    title: "Recomendação MaaS AI",
    text: "Score de 0 a 100 considerando preço, tempo, CO₂, política e cashback.",
  },
  {
    icon: Wallet,
    title: "Carteira corporativa",
    text: "Saldo, limite mensal e regras da empresa validados antes de recomendar.",
  },
  {
    icon: Leaf,
    title: "Impacto ambiental",
    text: "Emissão estimada por trajeto e incentivo a modais sustentáveis.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative mx-auto mt-4 min-h-[560px] max-w-7xl overflow-hidden border-y border-border sm:mt-6 sm:rounded-lg sm:border">
          <img src={mobilityCity} alt="Rede inteligente com metrô, ônibus, carro e bicicleta em São Paulo" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_0%,color-mix(in_oklab,var(--background)_88%,transparent)_43%,color-mix(in_oklab,var(--background)_22%,transparent)_100%)]" />
          <div className="relative z-10 flex min-h-[560px] max-w-3xl flex-col justify-center px-6 py-16 sm:px-12">
            <p className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/30 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
              <span className="signal-pulse h-2 w-2 rounded-full bg-primary" /> Rede MaaS conectada
            </p>
            <h1 className="mt-6 text-4xl font-bold text-foreground sm:text-6xl">
              Mobilidade corporativa, conectada em tempo real.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Uma carteira digital para metrô, ônibus, bicicleta e carro por app, com rotas inteligentes para cada deslocamento.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/planejar"
              className="rounded-md bg-brand-gradient px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Planejar uma viagem
            </Link>
            <Link
              to="/rh"
              className="rounded-md border border-border bg-card/80 px-6 py-3 font-semibold text-foreground backdrop-blur transition-colors hover:bg-secondary"
            >
              Ver portal do RH
            </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2"><BusFront className="h-4 w-4 text-primary" /> Transporte público</span>
              <span className="flex items-center gap-2"><CarFront className="h-4 w-4 text-primary" /> Carro por app</span>
              <span className="flex items-center gap-2"><Bike className="h-4 w-4 text-eco" /> Micromobilidade</span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="rounded-lg border border-border bg-card/90 p-6 shadow-soft backdrop-blur transition-colors hover:border-primary/40">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-accent text-primary"><h.icon className="h-5 w-5" /></span>
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
