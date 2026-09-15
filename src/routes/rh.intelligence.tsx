import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Info, Lightbulb, Sparkles, TrendingUp } from "lucide-react";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Button } from "@/components/ui/button";
import { brl, brlCompact, pct } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { analyticsService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/intelligence")({
  head: () => ({
    meta: [
      { title: "MaaS Intelligence — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Inteligência artificial aplicada à mobilidade corporativa: economia potencial, insights e previsão de gastos.",
      },
      { property: "og:title", content: "MaaS Intelligence — Portal RH" },
      {
        property: "og:description",
        content: "Oportunidades de economia, créditos ociosos e previsão estimada de custos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const { can } = useRhSession();
  const { data } = useQuery({
    queryKey: ["rh", "intelligence"],
    queryFn: () => analyticsService.getIntelligence(),
  });

  if (!can("intelligence")) return <NoAccess area="a MaaS Intelligence" />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;

  const f = data.forecast;
  const range = f.high - f.low;
  const position = ((f.nextMonth - f.low) / range) * 100;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="MaaS Intelligence"
        subtitle="Inteligência Artificial aplicada à mobilidade corporativa."
      />

      <DemoDataNotice text="Os números são estimativas calculadas sobre os dados de demonstração. Estimativas não representam valores garantidos." />

      <section className="rounded-2xl border border-primary/30 bg-card p-6 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Economia potencial identificada
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-foreground">
              {brlCompact(data.potentialSaving)}
              <span className="text-base font-medium text-muted-foreground">/mês</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{data.summary}</p>
          </div>
          <Button asChild>
            <Link to="/rh/politicas">Ver oportunidades</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.insights.map((i, idx) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Lightbulb className="h-3.5 w-3.5" /> Insight {idx + 1}
            </p>
            <h3 className="mt-2 font-display text-base font-semibold text-foreground">{i.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>
            <p className="mt-4 rounded-xl bg-eco/10 p-3 text-sm font-semibold text-eco">
              {i.impactLabel}: {brlCompact(i.impactValue)}/mês
            </p>
          </div>
        ))}
      </div>

      <RhSection
        title="Previsão de gastos"
        description="Projeção estatística baseada no histórico do programa."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">
            <Info className="h-3.5 w-3.5" /> Estimativa, não é valor garantido
          </span>
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Próximo mês</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">{brlCompact(f.nextMonth)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning">
              <TrendingUp className="h-3.5 w-3.5" /> +{pct(f.variation)} vs. mês atual
            </p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs text-muted-foreground">
              Intervalo estimado: {brlCompact(f.low)} – {brlCompact(f.high)}
            </p>
            <div className="relative mt-3 h-3 rounded-full bg-secondary">
              <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-primary/20" />
              <div
                className="absolute -top-1 h-5 w-1.5 rounded-full bg-primary"
                style={{ left: `calc(${Math.min(Math.max(position, 0), 100)}% - 3px)` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{brlCompact(f.low)}</span>
              <span>{brlCompact(f.high)}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Mês atual: <strong className="text-foreground">{brl(f.currentMonth)}</strong>. Cenários
              dependem de sazonalidade, número de colaboradores ativos e adesão às campanhas de cashback.
            </p>
          </div>
        </div>
      </RhSection>

      <RhSection title="Próximos passos sugeridos" description="Fluxo recomendado para capturar a economia identificada.">
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            { to: "/rh/politicas", label: "1. Ajustar política de mobilidade", text: "Reforce janelas e tetos para carro por app." },
            { to: "/rh/cashback", label: "2. Criar campanha de cashback", text: "Incentive bicicleta e transporte público." },
            { to: "/rh/esg", label: "3. Acompanhar impacto ESG", text: "Monitore CO₂ evitado e participação sustentável." },
          ].map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="block h-full rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
              </Link>
            </li>
          ))}
        </ol>
      </RhSection>
    </div>
  );
}
