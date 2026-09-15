import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { brl, brlCompact, num } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { creditService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos e Carteira — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Compre créditos de mobilidade, acompanhe o saldo corporativo e distribua o benefício entre os colaboradores.",
      },
      { property: "og:title", content: "Créditos e Carteira — Portal RH" },
      {
        property: "og:description",
        content: "Saldo corporativo, compra simulada de créditos e regras de distribuição.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreditosPage,
});

function CreditosPage() {
  const { can } = useRhSession();
  const { data } = useQuery({ queryKey: ["rh", "credits"], queryFn: () => creditService.getAccount() });
  const [amount, setAmount] = useState("50000");
  const [method, setMethod] = useState("PIX");

  if (!can("credits")) return <NoAccess area="a carteira corporativa" />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Créditos e Carteira"
        subtitle="Compra, saldo e distribuição dos créditos de mobilidade da empresa."
      />

      <DemoDataNotice text="Fluxo financeiro SIMULADO. Nenhuma cobrança real é gerada no MVP — PIX, boleto e transferência são apenas representações da experiência." />

      <div className="grid gap-4 sm:grid-cols-3">
        <RhKpiCard
          label="Saldo corporativo atual"
          value={brlCompact(data.corporateBalance)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <RhKpiCard label="Colaboradores no programa" value={num(data.employees)} />
        <RhKpiCard
          label="Próxima distribuição"
          value={data.nextDistribution}
          hint={`Crédito médio de ${brl(data.averageCredit)}`}
          icon={<CalendarClock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RhSection title="Comprar créditos de mobilidade" description="Recarregue a carteira corporativa.">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da compra</Label>
              <Input
                id="amount"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="50000"
              />
              <p className="text-xs text-muted-foreground">{brl(Number(amount || 0))}</p>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <RadioGroup value={method} onValueChange={setMethod} className="gap-2">
                {["PIX", "Boleto", "Transferência empresarial"].map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm has-[:checked]:border-primary/50 has-[:checked]:bg-secondary/60"
                  >
                    <RadioGroupItem value={m} id={m} />
                    <span className="text-foreground">{m}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Button
              className="w-full"
              disabled={!can("write")}
              onClick={async () => {
                const value = Number(amount || 0);
                if (value <= 0) {
                  toast.error("Informe um valor de compra.");
                  return;
                }
                const res = await creditService.purchase(value, method);
                toast.success(`Compra simulada de ${brl(value)} via ${method}`, {
                  description: `Protocolo ${res.protocol}. Nenhum pagamento real foi processado.`,
                });
              }}
            >
              Comprar créditos
            </Button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5" /> Fluxo de pagamento simulado para o MVP.
            </p>
          </div>
        </RhSection>

        <RhSection
          title="Distribuição de créditos"
          description={`${num(data.employees)} colaboradores · crédito médio de ${brl(data.averageCredit)} · próxima distribuição em ${data.nextDistribution}.`}
        >
          <div className="space-y-3">
            {data.byDepartment.map((d) => (
              <div key={d.department} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm">
                <span className="text-foreground">{d.department}</span>
                <span className="text-muted-foreground">
                  {brl(d.amount)} · {num(d.employees)} pessoas
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!can("write")}
              onClick={async () => {
                await creditService.distribute("EQUAL", data.averageCredit);
                toast.success("Distribuição igualitária simulada", {
                  description: `${brl(data.averageCredit)} para cada um dos ${num(data.employees)} colaboradores.`,
                });
              }}
            >
              Distribuir igualmente
            </Button>
            <Button
              disabled={!can("write")}
              onClick={async () => {
                await creditService.distribute("POLICY");
                toast.success("Distribuição por política simulada", {
                  description: "Cada departamento recebe o valor definido na política vigente.",
                });
              }}
            >
              Distribuir por política
            </Button>
          </div>
        </RhSection>
      </div>

      <RhSection title="Histórico de compras" description="Registros do ambiente de demonstração.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Valor</th>
                <th className="pb-3 font-medium">Forma de pagamento</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.purchases.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2.5 text-muted-foreground">{p.date}</td>
                  <td className="py-2.5 text-foreground">{brlCompact(p.amount)}</td>
                  <td className="py-2.5 text-muted-foreground">{p.method}</td>
                  <td className="py-2.5 text-warning">Simulada</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RhSection>
    </div>
  );
}
