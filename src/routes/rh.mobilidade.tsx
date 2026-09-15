import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Route as RouteIcon, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { brl, num } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { analyticsService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/mobilidade")({
  head: () => ({
    meta: [
      { title: "Mobilidade — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Análise operacional agregada das viagens corporativas: custo médio, tempo, distância, picos e regiões.",
      },
      { property: "og:title", content: "Mobilidade — Portal RH" },
      {
        property: "og:description",
        content: "Indicadores agregados de deslocamento, sem exposição de localização individual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MobilidadePage,
});

function MobilidadePage() {
  const { can } = useRhSession();
  const { data } = useQuery({ queryKey: ["rh", "mobility"], queryFn: () => analyticsService.getMobility() });

  if (!can("mobility")) return <NoAccess area="a análise de mobilidade" />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;

  const maxOrigin = Math.max(...data.topOrigins.map((o) => o.trips));
  const maxDest = Math.max(...data.topDestinations.map((o) => o.trips));

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Mobilidade"
        subtitle="Visão operacional agregada dos deslocamentos corporativos do período."
      />

      <DemoDataNotice text="Dados agregados de demonstração. O portal não expõe localização individual de colaboradores." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RhKpiCard label="Viagens no mês" value={num(data.tripsThisMonth)} icon={<RouteIcon className="h-4 w-4" />} />
        <RhKpiCard label="Custo médio por viagem" value={brl(data.averageCost)} icon={<Wallet className="h-4 w-4" />} />
        <RhKpiCard label="Tempo médio" value={`${data.averageMinutes} minutos`} icon={<Clock className="h-4 w-4" />} />
        <RhKpiCard label="Distância média" value={`${data.averageKm.toLocaleString("pt-BR")} km`} icon={<MapPin className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RhSection title="Horários de maior utilização" description="Concentração de viagens por faixa horária.">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} />
                <Tooltip
                  formatter={(v: number) => [num(v), "Viagens"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Bar dataKey="trips" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </RhSection>

        <RhSection title="Top modais" description="Volume de viagens por modal no período.">
          <ul className="space-y-3">
            {data.topModals.map((m) => {
              const share = Math.round((m.trips / data.tripsThisMonth) * 100);
              return (
                <li key={m.modal}>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{m.modal}</span>
                    <span className="text-muted-foreground">
                      {num(m.trips)} viagens · {share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-brand-gradient" style={{ width: `${share}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </RhSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RhSection title="Principais origens" description="Mapa de calor conceitual por região agregada.">
          <ul className="space-y-2">
            {data.topOrigins.map((o) => (
              <li key={o.area} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 text-foreground">{o.area}</span>
                <span
                  className="h-7 rounded-lg bg-primary/70"
                  style={{ width: `${(o.trips / maxOrigin) * 60}%`, opacity: 0.35 + (o.trips / maxOrigin) * 0.6 }}
                />
                <span className="ml-auto text-muted-foreground">{num(o.trips)}</span>
              </li>
            ))}
          </ul>
        </RhSection>

        <RhSection title="Principais destinos" description="Concentração de chegada por região agregada.">
          <ul className="space-y-2">
            {data.topDestinations.map((o) => (
              <li key={o.area} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 text-foreground">{o.area}</span>
                <span
                  className="h-7 rounded-lg bg-eco/70"
                  style={{ width: `${(o.trips / maxDest) * 60}%`, opacity: 0.35 + (o.trips / maxDest) * 0.6 }}
                />
                <span className="ml-auto text-muted-foreground">{num(o.trips)}</span>
              </li>
            ))}
          </ul>
        </RhSection>
      </div>
    </div>
  );
}
