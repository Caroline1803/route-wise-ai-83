import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { deleteEstimate, listEstimates } from "@/lib/employee/employee.functions";
import { MODE_LABEL, type TransportMode } from "@/lib/estimate/calc";
import { brl, dateTime } from "@/lib/rh/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/employee/spending-estimate/history")({
  head: () => ({
    meta: [
      { title: "Histórico de estimativas — MaaS Corporate AI" },
      { name: "description", content: "Veja, refaça, compare e exclua suas estimativas de gastos com mobilidade." },
      { property: "og:title", content: "Histórico de estimativas — MaaS Corporate AI" },
      { property: "og:description", content: "Suas estimativas de gastos com mobilidade salvas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listEstimates);
  const remove = useServerFn(deleteEstimate);
  const { data = [], isLoading } = useQuery({ queryKey: ["estimates"], queryFn: () => fetchList() });
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));

  async function onDelete(id: string) {
    await remove({ data: { id } });
    setSelected((s) => s.filter((x) => x !== id));
    qc.invalidateQueries({ queryKey: ["estimates"] });
    toast.success("Estimativa excluída.");
  }

  const compared = data.filter((e) => selected.includes(e.id));
  const viewed = data.find((e) => e.id === viewing);

  return (
    <EmployeeShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground">Histórico de estimativas</h1>
        <Button asChild><Link to="/employee/spending-estimate">Nova estimativa</Link></Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Marque até 3 estimativas para comparar.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card/85 shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">Comparar</th><th className="p-3">Data</th><th className="p-3">Origem</th><th className="p-3">Destino</th>
              <th className="p-3">Modal</th><th className="p-3 text-right">Estimativa mensal</th><th className="p-3 text-right">Crédito</th>
              <th className="p-3 text-right">Diferença</th><th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Carregando...</td></tr> : null}
            {!isLoading && data.length === 0 ? <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Nenhuma estimativa salva ainda.</td></tr> : null}
            {data.map((e) => {
              const diff = Number(e.corporate_credit) - Number(e.estimated_monthly_cost);
              return (
                <tr key={e.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3"><input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} className="accent-[var(--primary)]" aria-label="Selecionar para comparar" /></td>
                  <td className="p-3 text-muted-foreground">{dateTime(e.created_at)}</td>
                  <td className="p-3 text-foreground">{e.origin}</td>
                  <td className="p-3 text-foreground">{e.destination}</td>
                  <td className="p-3 text-foreground">{MODE_LABEL[e.transport_mode as TransportMode] ?? e.transport_mode}</td>
                  <td className="p-3 text-right font-semibold text-foreground">{brl(Number(e.estimated_monthly_cost))}</td>
                  <td className="p-3 text-right text-foreground">{brl(Number(e.corporate_credit))}</td>
                  <td className={cn("p-3 text-right font-medium", diff >= 0 ? "text-eco" : "text-warning")}>{diff >= 0 ? "+" : "−"}{brl(Math.abs(diff))}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setViewing(viewing === e.id ? null : e.id)} aria-label="Visualizar"><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" asChild aria-label="Refazer cálculo">
                        <Link to="/employee/spending-estimate" search={{ origin: e.origin, destination: e.destination, mode: e.transport_mode, trips: e.trips_per_day, days: e.days_per_week, wd: e.working_days_month }}>
                          <RotateCcw className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(e.id)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewed ? (
        <section className="mt-6 rounded-lg border border-border bg-card/85 p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-foreground">{viewed.origin} → {viewed.destination}</h2>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <p>{viewed.trips_per_day} viagens/dia · {viewed.days_per_week} dias/semana · {viewed.working_days_month} dias úteis</p>
            <p>Diário: <b>{brl(Number(viewed.estimated_daily_cost))}</b></p>
            <p>Semanal: <b>{brl(Number(viewed.estimated_weekly_cost))}</b></p>
            <p>Mensal: <b>{brl(Number(viewed.estimated_monthly_cost))}</b></p>
          </div>
        </section>
      ) : null}

      {compared.length >= 2 ? (
        <section className="mt-6 rounded-lg border border-primary/30 bg-card/85 p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-foreground">Comparação</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {compared.map((e) => {
              const min = Math.min(...compared.map((c) => Number(c.estimated_monthly_cost)));
              const best = Number(e.estimated_monthly_cost) === min;
              return (
                <div key={e.id} className={cn("rounded-md border p-4", best ? "border-eco/60 bg-eco/10" : "border-border")}>
                  <p className="text-xs text-muted-foreground">{dateTime(e.created_at)}</p>
                  <p className="font-semibold text-foreground">{MODE_LABEL[e.transport_mode as TransportMode] ?? e.transport_mode}</p>
                  <p className="mt-1 font-display text-xl font-bold text-foreground">{brl(Number(e.estimated_monthly_cost))}</p>
                  {best ? <p className="text-xs font-semibold text-eco">Mais econômica</p> : <p className="text-xs text-muted-foreground">+{brl(Number(e.estimated_monthly_cost) - min)} vs. melhor</p>}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </EmployeeShell>
  );
}
