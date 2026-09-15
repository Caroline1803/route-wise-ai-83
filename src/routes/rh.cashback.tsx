import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { brl, brlCompact, num } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { cashbackService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/cashback")({
  head: () => ({
    meta: [
      { title: "Cashback — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Crie campanhas de cashback por modal, defina período, público, percentual e orçamento máximo.",
      },
      { property: "og:title", content: "Cashback — Portal RH" },
      {
        property: "og:description",
        content: "Campanhas de incentivo à mobilidade sustentável e cashback distribuído.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CashbackPage,
});

function CashbackPage() {
  const { can } = useRhSession();
  const { data } = useQuery({ queryKey: ["rh", "cashback"], queryFn: () => cashbackService.get() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    period: "01/10/2026 — 31/10/2026",
    audience: "Todos os colaboradores",
    modal: "Bicicleta",
    rate: "5",
    budget: "10000",
  });

  if (!can("cashback")) return <NoAccess area="as campanhas de cashback" />;
  if (!data) return <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Cashback"
        subtitle="Campanhas de incentivo que devolvem parte do valor das viagens ao colaborador."
        action={
          can("write") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-1.5 h-4 w-4" /> Criar campanha</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova campanha de cashback</DialogTitle>
                  <DialogDescription>
                    Defina período, público, modal, percentual e orçamento máximo. No MVP a campanha é
                    criada apenas na sessão atual.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cname">Nome da campanha</Label>
                    <Input id="cname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Setembro sustentável" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cperiod">Período</Label>
                    <Input id="cperiod" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caudience">Público</Label>
                    <Input id="caudience" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Modal</Label>
                      <Select value={form.modal} onValueChange={(v) => setForm({ ...form, modal: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Bicicleta", "Transporte público", "Uber/99"].map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crate">Percentual (%)</Label>
                      <Input id="crate" inputMode="numeric" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value.replace(/\D/g, "") })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cbudget">Orçamento (R$)</Label>
                      <Input id="cbudget" inputMode="numeric" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value.replace(/\D/g, "") })} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      if (!form.name.trim()) {
                        toast.error("Informe o nome da campanha.");
                        return;
                      }
                      await cashbackService.createCampaign({
                        name: form.name,
                        active: true,
                        period: form.period,
                        audience: form.audience,
                        rates: [{ modal: form.modal, rate: Number(form.rate || 0) }],
                        budget: Number(form.budget || 0),
                      });
                      toast.success(`Campanha "${form.name}" criada (simulação).`);
                      setOpen(false);
                    }}
                  >
                    Criar campanha
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <DemoDataNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <RhKpiCard label="Cashback distribuído" value={brlCompact(data.distributed)} accent="eco" />
        <RhKpiCard label="Colaboradores participantes" value={num(data.participants)} />
        <RhKpiCard label="Campanhas ativas" value={String(data.activeCampaigns)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.campaigns.map((c) => {
          const usage = Math.round((c.used / c.budget) * 100);
          return (
            <RhSection
              key={c.id}
              title={c.name}
              description={`${c.period} · ${c.audience}`}
              action={
                <Badge variant="secondary" className={c.active ? "border-0 bg-eco/15 text-eco" : "border-0"}>
                  {c.active ? "Ativa" : "Encerrada"}
                </Badge>
              }
            >
              <ul className="flex flex-wrap gap-2">
                {c.rates.map((r) => (
                  <li key={r.modal} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                    {r.modal}: <strong className="text-eco">{r.rate}%</strong>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Orçamento utilizado</span>
                  <span>
                    {brl(c.used)} de {brl(c.budget)}
                  </span>
                </div>
                <Progress value={usage} className="mt-2 h-2.5" />
              </div>
            </RhSection>
          );
        })}
      </div>
    </div>
  );
}
