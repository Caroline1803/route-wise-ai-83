import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, Lightbulb, Plus, Save, Trash2, Trophy, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { SourceBadge } from "@/components/rh/SourceBadge";
import { getWalletCredit, saveEstimate } from "@/lib/employee/employee.functions";
import {
  businessDaysInMonth,
  calcEstimate,
  compareCosts,
  costPerTripFor,
  MODE_LABEL,
  r2,
  savingTips,
  SEGMENT_OPTIONS,
  segmentsCost,
  type Segment,
  type SegmentModal,
  type TransportMode,
} from "@/lib/estimate/calc";
import { brl } from "@/lib/rh/format";
import { cn } from "@/lib/utils";

const MODES_SELECT: TransportMode[] = ["bus", "metro", "uber", "99", "bike", "scooter", "multimodal"];

const searchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  mode: z.string().optional(),
  trips: z.coerce.number().optional(),
  days: z.coerce.number().optional(),
  wd: z.coerce.number().optional(),
});

export const Route = createFileRoute("/_authenticated/employee/spending-estimate/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Estimativa de gastos com mobilidade — MaaS Corporate AI" },
      { name: "description", content: "Calcule quanto vai gastar com transporte e compare com seu benefício corporativo." },
      { property: "og:title", content: "Estimativa de gastos com mobilidade — MaaS Corporate AI" },
      { property: "og:description", content: "Compare modais e descubra se seu crédito corporativo é suficiente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstimatePage,
});

const inputCls = "mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function EstimatePage() {
  const s = Route.useSearch();
  const qc = useQueryClient();
  const fetchCredit = useServerFn(getWalletCredit);
  const save = useServerFn(saveEstimate);
  const { data: creditData } = useQuery({ queryKey: ["wallet-credit"], queryFn: () => fetchCredit() });
  const credit = creditData?.credit ?? 350;

  const [origin, setOrigin] = useState(s.origin ?? "Casa");
  const [destination, setDestination] = useState(s.destination ?? "Empresa");
  const [days, setDays] = useState(s.days ?? 5);
  const [trips, setTrips] = useState(s.trips ?? 2);
  const [mode, setMode] = useState<TransportMode>(
    MODES_SELECT.includes(s.mode as TransportMode) ? (s.mode as TransportMode) : s.mode === "public_transport" ? "bus" : "bus",
  );
  const [period, setPeriod] = useState<"weekly" | "monthly" | "custom">("monthly");
  const [autoDays, setAutoDays] = useState(!s.wd);
  const [manualWd, setManualWd] = useState(s.wd ?? 22);
  const [customDays, setCustomDays] = useState(10);
  const [segments, setSegments] = useState<Segment[]>([
    { modal: "bus", cost: 5.2 },
    { modal: "metro", cost: 5.2, integrated: true },
    { modal: "scooter", cost: 6.5 },
  ]);
  const [saving, setSaving] = useState(false);

  const autoWd = Math.round((businessDaysInMonth() * days) / 5);
  const workingDays = Math.max(1, Math.min(31, autoDays ? autoWd : manualWd));

  const costPerTrip = costPerTripFor(mode, segments);
  const result = useMemo(
    () => calcEstimate({ costPerTrip, tripsPerDay: trips, daysPerWeek: days, workingDaysMonth: workingDays, corporateCredit: credit }),
    [costPerTrip, trips, days, workingDays, credit],
  );
  const comparison = useMemo(() => compareCosts(trips, workingDays), [trips, workingDays]);
  const cheapest = comparison.reduce((a, b) => (b.monthly_cost < a.monthly_cost ? b : a));
  const fastest = comparison.reduce((a, b) => (b.minutes_per_trip < a.minutes_per_trip ? b : a));
  const tips = savingTips({ mode, tripsPerDay: trips, daysPerWeek: days, workingDaysMonth: workingDays, corporateCredit: credit, monthlyCost: result.monthly_cost });

  const chartData = [
    { name: "Benefício", value: result.corporate_credit, color: "var(--primary)" },
    { name: "Gasto previsto", value: result.monthly_cost, color: "var(--warning)" },
    { name: "Saldo restante", value: result.remaining_balance, color: "var(--eco)" },
    { name: "Complemento pessoal", value: result.personal_top_up, color: "var(--destructive)" },
  ];

  const periodValue = period === "weekly" ? result.weekly_cost : period === "custom" ? r2(result.daily_cost * customDays) : result.monthly_cost;
  const periodLabel = period === "weekly" ? "Estimativa semanal" : period === "custom" ? `Estimativa para ${customDays} dias` : "Estimativa mensal";

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: {
          origin,
          destination,
          transport_mode: mode,
          trips_per_day: trips,
          days_per_week: days,
          working_days_month: workingDays,
          cost_per_trip: costPerTrip,
        },
      });
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["employee-dashboard"] });
      toast.success("Estimativa salva no seu histórico.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <EmployeeShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Estimativa de Gastos com Mobilidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">Descubra quanto vai gastar e se seu benefício é suficiente.</p>
        </div>
        <SourceBadge source="MOCK" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Formulário */}
        <section className="space-y-4 rounded-lg border border-border bg-card/85 p-5 shadow-soft">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Origem</Label><Input className="mt-1.5" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Casa" maxLength={120} /></div>
            <div><Label>Destino</Label><Input className="mt-1.5" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Empresa" maxLength={120} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantos dias por semana?</Label>
              <select className={inputCls} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label>Viagens por dia</Label>
              <Input className="mt-1.5" type="number" min={1} max={10} value={trips} onChange={(e) => setTrips(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} />
              <p className="mt-1 text-[11px] text-muted-foreground">Ida + volta = 2 viagens</p>
            </div>
          </div>
          <div>
            <Label>Modal preferido</Label>
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as TransportMode)}>
              {MODES_SELECT.map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
            </select>
          </div>
          <div>
            <Label>Período</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-md border border-border p-1">
              {([["weekly", "Semanal"], ["monthly", "Mensal"], ["custom", "Personalizado"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setPeriod(v)} className={cn("rounded px-2 py-1.5 text-xs font-medium", period === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
            {period === "custom" ? (
              <Input className="mt-2" type="number" min={1} max={365} value={customDays} onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} aria-label="Dias do período personalizado" />
            ) : null}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Dias úteis no mês</Label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={autoDays} onChange={(e) => setAutoDays(e.target.checked)} className="accent-[var(--primary)]" />
                Calcular automaticamente
              </label>
            </div>
            <Input className="mt-1.5" type="number" min={1} max={31} disabled={autoDays} value={autoDays ? autoWd : manualWd} onChange={(e) => setManualWd(Number(e.target.value) || 1)} />
          </div>

          {mode === "multimodal" ? (
            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-sm font-semibold text-foreground">Trechos da ida</p>
              <p className="mt-2 text-xs text-muted-foreground">{origin || "Origem"}</p>
              {segments.map((seg, i) => (
                <div key={i}>
                  <ArrowDown className="my-1 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                      value={seg.modal}
                      onChange={(e) => {
                        const opt = SEGMENT_OPTIONS.find((o) => o.value === e.target.value)!;
                        setSegments(segments.map((x, j) => (j === i ? { ...x, modal: opt.value as SegmentModal, cost: opt.cost } : x)));
                      }}
                    >
                      {SEGMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Input className="h-8 w-20 text-xs" type="number" step="0.1" min={0} value={seg.cost} onChange={(e) => setSegments(segments.map((x, j) => (j === i ? { ...x, cost: Math.max(0, Number(e.target.value) || 0) } : x)))} aria-label="Custo do trecho" />
                    <button type="button" onClick={() => setSegments(segments.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remover trecho"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {i > 0 && ["metro", "train"].includes(seg.modal) ? (
                    <label className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={!!seg.integrated} onChange={(e) => setSegments(segments.map((x, j) => (j === i ? { ...x, integrated: e.target.checked } : x)))} className="accent-[var(--primary)]" />
                      Integração disponível (R$ 0,00)
                    </label>
                  ) : null}
                </div>
              ))}
              <ArrowDown className="my-1 h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{destination || "Destino"}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setSegments([...segments, { modal: "walk", cost: 0 }])} disabled={segments.length >= 6}>
                <Plus className="h-3.5 w-3.5" /> Adicionar trecho
              </Button>
              <div className="mt-3 space-y-0.5 text-xs text-foreground">
                <p>Custo total da ida: <b>{brl(segmentsCost(segments))}</b></p>
                <p>Ida + volta: <b>{brl(r2(segmentsCost(segments) * 2))}</b></p>
                <p>{workingDays} dias: <b>{brl(r2(segmentsCost(segments) * trips * workingDays))}/mês</b></p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Resultado */}
        <div className="space-y-6">
          <section className="rounded-lg border border-primary/30 bg-card/85 p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">
              {brl(costPerTrip)} × {trips} = {brl(result.daily_cost)} por dia · × {workingDays} dias úteis
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{periodLabel}</p>
            <p className="font-display text-4xl font-bold text-foreground">{brl(periodValue)}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Diário</p><p className="font-semibold text-foreground">{brl(result.daily_cost)}</p></div>
              <div><p className="text-xs text-muted-foreground">Semanal</p><p className="font-semibold text-foreground">{brl(result.weekly_cost)}</p></div>
              <div><p className="text-xs text-muted-foreground">Mensal</p><p className="font-semibold text-foreground">{brl(result.monthly_cost)}</p></div>
            </div>
            <div className={cn("mt-5 rounded-md border p-4", result.personal_top_up > 0 ? "border-warning/40 bg-warning/10" : "border-eco/40 bg-eco/10")}>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p>Crédito corporativo mensal: <b>{brl(credit)}</b></p>
                <p>Gasto previsto: <b>{brl(result.monthly_cost)}</b></p>
                {result.personal_top_up > 0 ? <p>Diferença: <b>{brl(result.personal_top_up)}</b></p> : <p>Saldo previsto: <b>{brl(result.remaining_balance)}</b></p>}
              </div>
              <p className={cn("mt-2 font-semibold", result.personal_top_up > 0 ? "text-warning" : "text-eco")}>
                {result.personal_top_up > 0
                  ? `Seu benefício cobre aproximadamente ${result.coverage_percentage}% do gasto previsto.`
                  : "Seu benefício é suficiente para o gasto estimado deste mês."}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={onSave} disabled={saving || !origin.trim() || !destination.trim()}><Save className="h-4 w-4" /> Salvar estimativa</Button>
              <Button asChild variant="secondary"><Link to="/planejar">Planejar viagem</Link></Button>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card/85 p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold text-foreground">Comparação entre modais</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...comparison].sort((a, b) => a.monthly_cost - b.monthly_cost).map((c) => (
                <div key={c.mode} className={cn("rounded-md border p-4", c.mode === cheapest.mode ? "border-eco/60 bg-eco/10" : c.mode === fastest.mode ? "border-primary/60 bg-primary/10" : "border-border bg-secondary/30")}>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="font-semibold text-foreground">{c.label}</p>
                    <div className="flex gap-1">
                      {c.mode === cheapest.mode ? <span className="inline-flex items-center gap-1 rounded bg-eco/20 px-1.5 py-0.5 text-[10px] font-semibold text-eco"><Trophy className="h-3 w-3" />Mais econômica</span> : null}
                      {c.mode === fastest.mode ? <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary"><Zap className="h-3 w-3" />Mais rápida</span> : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Custo por viagem: {brl(c.cost_per_trip)} · ~{c.minutes_per_trip} min</p>
                  <p className="mt-2 font-display text-xl font-bold text-foreground">{brl(c.monthly_cost)}</p>
                  <p className={cn("text-xs", c.monthly_cost <= credit ? "text-eco" : "text-warning")}>
                    {c.monthly_cost <= credit ? "Cabe no seu benefício" : `Complemento de ${brl(r2(c.monthly_cost - credit))}`}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card/85 p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold text-foreground">Benefício x gasto previsto</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-eco/30 bg-card/85 p-5 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><Lightbulb className="h-5 w-5 text-eco" /> Como você pode economizar?</h2>
            <ul className="mt-3 space-y-2">
              {tips.map((t) => <li key={t} className="rounded-md bg-secondary/40 p-3 text-sm text-foreground">{t}</li>)}
            </ul>
          </section>
        </div>
      </div>
    </EmployeeShell>
  );
}
