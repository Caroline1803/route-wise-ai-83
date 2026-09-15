import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  Leaf,
  Lightbulb,
  PiggyBank,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { RH_CHART_COLORS } from "@/components/rh/RhShell";
import { Button } from "@/components/ui/button";
import { brl, brlCompact, num, pct } from "@/lib/rh/format";
import { rhDashboardService } from "@/lib/rh/services";
import type { AlertKind } from "@/lib/rh/types";

export const Route = createFileRoute("/rh/")({
  head: () => ({
    meta: [
      { title: "Gestão de Mobilidade — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Acompanhe benefícios, custos, cashback e comportamento de mobilidade dos colaboradores da sua empresa.",
      },
      { property: "og:title", content: "Gestão de Mobilidade — Portal RH" },
      {
        property: "og:description",
        content: "Dashboard corporativo de créditos, gastos por modal e alertas inteligentes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RhDashboard,
});

const ALERT_ICON: Record<AlertKind, typeof Lightbulb> = {
  BUDGET: AlertTriangle,
  SAVING: Lightbulb,
  SUSTAINABILITY: Leaf,
  ANOMALY: AlertTriangle,
};

function RhDashboard() {
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const { data } = useQuery({
    queryKey: ["rh", "dashboard"],
    queryFn: () => rhDashboardService.getDashboard(),
  });
  const { data: history } = useQuery({
    queryKey: ["rh", "spend", months],
    queryFn: () => rhDashboardService.getSpendHistory(months),
  });

  console.log("DASH_STATE", typeof window, !!data, !!history);
  if (!data) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  const k = data.kpis;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Gestão de Mobilidade"
        subtitle="Acompanhe os benefícios, custos e comportamento de mobilidade da sua empresa."
        action={
          <Button asChild variant="outline">
            <Link to="/rh/intelligence">Ver MaaS Intelligence</Link>
          </Button>
        }
      />

      <DemoDataNotice />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <RhKpiCard
          label="Colaboradores ativos"
          value={num(k.activeEmployees)}
          delta={{ value: k.activeEmployeesDelta.value, label: k.activeEmployeesDelta.label, positive: true }}
          icon={<Users className="h-4 w-4" />}
        />
        <RhKpiCard
          label="Créditos disponibilizados"
          value={brlCompact(k.creditsIssued)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <RhKpiCard
          label="Créditos utilizados"
          value={brlCompact(k.creditsUsed)}
          hint={`${pct(k.usageRate)} utilizado`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <RhKpiCard
          label="Saldo disponível"
          value={brlCompact(k.availableBalance)}
          icon={<PiggyBank className="h-4 w-4" />}
        />
        <RhKpiCard
          label="Economia gerada"
          value={brlCompact(k.savings)}
          accent="eco"
          icon={<Leaf className="h-4 w-4" />}
        />
        <RhKpiCard
          label="Cashback gerado"
          value={brlCompact(k.cashback)}
          accent="eco"
          icon={<PiggyBank className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <RhSection
          className="xl:col-span-3"
          title="Gastos com mobilidade"
          description="Evolução do custo total do programa."
          action={
            <div className="flex rounded-xl border border-border p-0.5">
              {([3, 6, 12] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    months === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m} meses
                </button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history ?? []} margin={{ left: 4, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={12}
                />
                <Tooltip
                  formatter={(v: number) => [brlCompact(v), "Gasto"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#spendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </RhSection>

        <RhSection
          className="xl:col-span-2"
          title="Como nossos colaboradores estão se deslocando?"
          description="Distribuição das viagens e custo por modal."
        >
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.modalShare}
                  dataKey="share"
                  nameKey="modal"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                >
                  {data.modalShare.map((_, i) => (
                    <Cell key={i} fill={RH_CHART_COLORS[i % RH_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${v}%`, n]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {data.modalShare.map((m, i) => (
              <li key={m.modal} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: RH_CHART_COLORS[i % RH_CHART_COLORS.length] }}
                />
                <span className="text-foreground">
                  {m.icon} {m.modal}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {m.share}% · {brlCompact(m.cost)}
                </span>
              </li>
            ))}
          </ul>
        </RhSection>
      </div>

      <RhSection
        title="Alertas"
        description="Sinais identificados automaticamente no período. Anomalias são classificadas como análise necessária, nunca como fraude."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {data.alerts.map((a) => {
            const Icon = ALERT_ICON[a.kind];
            return (
              <div
                key={a.id}
                className={`flex gap-3 rounded-xl border p-4 ${
                  a.severity === "attention"
                    ? "border-warning/40 bg-warning/10"
                    : "border-border bg-secondary/50"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    a.severity === "attention" ? "text-warning" : "text-primary"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </RhSection>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { to: "/rh/colaboradores", title: "Colaboradores", text: "Saldos, limites e perfis individuais." },
          { to: "/rh/creditos", title: "Créditos e Carteira", text: `Saldo corporativo de ${brl(k.availableBalance)}.` },
          { to: "/rh/politicas", title: "Políticas", text: "Regras de modal, horário e teto por viagem." },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary/40"
          >
            <p className="font-display text-sm font-semibold text-foreground">{c.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
