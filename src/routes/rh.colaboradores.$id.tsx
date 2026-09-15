import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Ban, Check, Shield, X } from "lucide-react";
import { toast } from "sonner";

import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dateTime } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { employeeService, policyService, transactionService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/colaboradores/$id")({
  head: () => ({
    meta: [
      { title: "Perfil do colaborador — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Limite mensal, saldo, modais autorizados, histórico de viagens e indicadores de um colaborador.",
      },
      { property: "og:title", content: "Perfil do colaborador — Portal RH" },
      {
        property: "og:description",
        content: "Benefício, histórico e indicadores individuais de mobilidade corporativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeeProfile,
});

function EmployeeProfile() {
  const { id } = Route.useParams();
  const { can } = useRhSession();
  const { data: employee } = useQuery({
    queryKey: ["rh", "employee", id],
    queryFn: () => employeeService.get(id),
  });
  const { data: transactions } = useQuery({
    queryKey: ["rh", "employee-transactions", id],
    queryFn: () => transactionService.list(),
  });
  const { data: policies } = useQuery({ queryKey: ["rh", "policies"], queryFn: () => policyService.list() });

  const [limit, setLimit] = useState<string>("");

  if (!can("employees")) return <NoAccess area="o perfil de colaboradores" />;
  if (!employee) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  const history = (transactions ?? []).filter((t) => t.employeeId === employee.id);
  const usage = Math.round((employee.used / employee.monthlyLimit) * 100);

  return (
    <div className="space-y-6">
      <Link
        to="/rh/colaboradores"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para colaboradores
      </Link>

      <RhPageHeader
        title={employee.name}
        subtitle={`${employee.role} · ${employee.department} · Matrícula ${employee.registration}`}
        action={
          <Badge variant="secondary" className="border-0 bg-eco/15 text-eco">
            {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <RhKpiCard label="Limite mensal" value={brl(employee.monthlyLimit)} />
        <RhKpiCard label="Utilizado" value={brl(employee.used)} hint={`${usage}% do limite`} />
        <RhKpiCard label="Saldo" value={brl(employee.balance)} accent="eco" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RhSection title="Benefício" description="Consumo do limite no período." className="lg:col-span-2">
          <Progress value={usage} className="h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {brl(employee.used)} de {brl(employee.monthlyLimit)} utilizados neste mês.
          </p>

          <h3 className="mt-6 text-sm font-semibold text-foreground">Modais autorizados</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Transporte público", "Bicicletas", "Uber", "99"].map((m) => {
              const allowed = employee.allowedModals.some((a) =>
                m.startsWith("Bicicleta") ? a.startsWith("Bicicleta") : a === m,
              );
              return (
                <li key={m} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  {allowed ? (
                    <Check className="h-4 w-4 text-eco" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className={allowed ? "text-foreground" : "text-muted-foreground"}>{m}</span>
                </li>
              );
            })}
          </ul>
        </RhSection>

        <RhSection title="Indicadores" description="Comportamento de mobilidade individual.">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Gasto médio mensal</dt>
              <dd className="font-semibold text-foreground">{brl(employee.avgMonthlySpend)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Modal mais utilizado</dt>
              <dd className="font-semibold text-foreground">{employee.mainModal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cashback acumulado</dt>
              <dd className="font-semibold text-eco">{brl(employee.cashbackAccrued)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CO₂ evitado</dt>
              <dd className="font-semibold text-eco">{employee.co2AvoidedKg} kg</dd>
            </div>
          </dl>
        </RhSection>
      </div>

      <RhSection title="Histórico" description="Viagens e transações recentes deste colaborador.">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem transações no período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Modal</th>
                  <th className="pb-3 font-medium">Trajeto</th>
                  <th className="pb-3 text-right font-medium">Valor</th>
                  <th className="pb-3 text-right font-medium">Cashback</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="py-2.5 text-muted-foreground">{dateTime(t.date)}</td>
                    <td className="py-2.5 text-foreground">{t.modal}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {t.origin} → {t.destination}
                    </td>
                    <td className="py-2.5 text-right text-foreground">{brl(t.amount)}</td>
                    <td className="py-2.5 text-right text-eco">{brl(t.cashback)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RhSection>

      {can("write") ? (
        <RhSection
          title="Ações do gestor"
          description="Alterações do MVP são simuladas e registradas para auditoria futura."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="limit">Alterar limite mensal</Label>
              <div className="flex gap-2">
                <Input
                  id="limit"
                  inputMode="numeric"
                  placeholder={String(employee.monthlyLimit)}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const v = Number(limit);
                    if (!v) return toast.error("Informe um valor válido.");
                    void employeeService.updateLimit(employee.id, v);
                    toast.success(`Novo limite simulado: ${brl(v)}`);
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy">Alterar política</Label>
              <Select
                defaultValue={employee.policyId}
                onValueChange={(v) =>
                  toast.success(
                    `Política alterada (simulação): ${policies?.find((p) => p.id === v)?.name ?? v}`,
                  )
                }
              >
                <SelectTrigger id="policy"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {policies?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Benefício</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void employeeService.toggleBlock(employee.id);
                  toast.warning("Bloqueio de benefício simulado", {
                    description: "Requer confirmação do RH Administrador no ambiente real.",
                  });
                }}
              >
                <Ban className="mr-1.5 h-4 w-4" /> Bloquear benefício
              </Button>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5" />
            A MaaS AI nunca executa estas ações sozinha — elas exigem confirmação de um perfil autorizado.
          </p>
        </RhSection>
      ) : null}
    </div>
  );
}
