import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { SourceBadge } from "@/components/rh/SourceBadge";
import { useRhSession } from "@/lib/rh/rbac";
import { analyticsService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Status das integrações de mobilidade: Google Maps, Uber, 99, bicicletas e transporte público.",
      },
      { property: "og:title", content: "Integrações — Portal RH" },
      {
        property: "og:description",
        content: "Origem de cada dado exibido na plataforma: LIVE, SANDBOX ou MOCK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegracoesPage,
});

function IntegracoesPage() {
  const { can } = useRhSession();
  const { data } = useQuery({
    queryKey: ["rh", "integrations"],
    queryFn: () => analyticsService.getIntegrations(),
  });

  if (!can("integrations")) return <NoAccess area="as integrações" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Integrações"
        subtitle="Origem real de cada informação apresentada na plataforma."
      />

      <p className="rounded-xl border border-border bg-secondary/60 p-4 text-sm text-secondary-foreground">
        <strong>LIVE</strong> significa API oficial em produção. <strong>SANDBOX</strong> é ambiente de
        testes do parceiro. <strong>MOCK</strong> é dado simulado internamente. Nenhum provider simulado é
        apresentado como integração real.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((i) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-foreground">{i.name}</h3>
              <SourceBadge source={i.source} />
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{i.purpose}</p>
            <p className="mt-3 text-sm text-muted-foreground">{i.detail}</p>
          </div>
        ))}
      </div>

      <RhSection title="Como ativar dados reais" description="Cada provider passa a LIVE de forma independente.">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Bicicletas: configurar um feed GBFS oficial do operador no backend.</li>
          <li>• Transporte público: configurar feeds GTFS e GTFS-Realtime da região atendida.</li>
          <li>• Uber e 99: depende de contrato e credenciais oficiais de API com cada parceiro.</li>
          <li>• Google Maps: já ativo para endereços, rotas, distâncias e tempos.</li>
        </ul>
      </RhSection>
    </div>
  );
}
