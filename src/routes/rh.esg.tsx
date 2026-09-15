import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { num, pct } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { esgService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/esg")({
  head: () => ({
    meta: [
      { title: "Mobilidade e Sustentabilidade — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "CO₂ evitado, viagens sustentáveis, participação por modal e evolução da mobilidade limpa da empresa.",
      },
      { property: "og:title", content: "Mobilidade e Sustentabilidade — Portal RH" },
      {
        property: "og:description",
        content: "Indicadores ESG do programa de mobilidade corporativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EsgPage,
});

function EsgPage() {
  const { can } = useRhSession();
  const { data } = useQuery({ queryKey: ["rh", "esg"], queryFn: () => esgService.get() });

  if (!can("esg")) return <NoAccess area="os indicadores ESG" />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;

  const maxEmission = Math.max(...data.comparison.map((c) => c.gramsPerKm));

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Mobilidade e Sustentabilidade"
        subtitle="Impacto ambiental do programa de mobilidade corporativa."
      />

      <DemoDataNotice />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RhKpiCard
          label="CO₂ evitado"
          value={`${data.co2AvoidedTons.toLocaleString("pt-BR")} toneladas`}
          accent="eco"
          icon={<Leaf className="h-4 w-4" />}
        />
        <RhKpiCard label="Viagens sustentáveis" value={num(data.sustainableTrips)} accent="eco" />
        <RhKpiCard label="Participação sustentável" value={`${data.sustainableShare}%`} accent="eco" />
        <RhKpiCard
          label="Evolução"
          value={`+${data.evolution}%`}
          delta={{ value: data.evolution, label: "vs. semestre", positive: true }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RhSection title="Evolução da mobilidade sustentável" description="Participação sustentável nos últimos 6 meses.">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[40, 80]} tickFormatter={(v: number) => `${v}%`} tickLine={false} axisLine={false} width={44} fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [pct(v, 0), "Participação"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Line type="monotone" dataKey="share" stroke="var(--color-eco)" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </RhSection>

        <RhSection
          title="Comparação de emissões"
          description="Emissão média de CO₂ por passageiro-quilômetro."
        >
          <ul className="space-y-4">
            {data.comparison.map((c) => (
              <li key={c.modal}>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{c.modal}</span>
                  <span className="text-muted-foreground">{c.gramsPerKm} g CO₂/km</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-secondary">
                  <div
                    className={`h-2.5 rounded-full ${c.gramsPerKm === 0 ? "bg-eco" : c.gramsPerKm > 100 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.max((c.gramsPerKm / maxEmission) * 100, 3)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl bg-eco/10 p-3 text-sm text-eco">
            Migrar 10% das viagens de carro individual para transporte público reduz aproximadamente 1,3 t
            de CO₂ por mês neste cenário de demonstração.
          </p>
        </RhSection>
      </div>
    </div>
  );
}
