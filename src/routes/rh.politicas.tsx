import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Pencil, Plus, Power, X } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
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
import { Switch } from "@/components/ui/switch";
import { brl, num } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { policyService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/politicas")({
  head: () => ({
    meta: [
      { title: "Políticas de Mobilidade — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Crie e gerencie regras de limite mensal, modais permitidos, janelas de horário e cashback por política.",
      },
      { property: "og:title", content: "Políticas de Mobilidade — Portal RH" },
      {
        property: "og:description",
        content: "Regras corporativas que determinam o que cada colaborador pode utilizar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PoliticasPage,
});

function PoliticasPage() {
  const { can } = useRhSession();
  const { data: policies } = useQuery({ queryKey: ["rh", "policies"], queryFn: () => policyService.list() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("600");

  if (!can("policies")) return <NoAccess area="as políticas de mobilidade" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Políticas de Mobilidade"
        subtitle="Defina limites, modais permitidos, janelas de horário e cashback por grupo de colaboradores."
        action={
          can("write") ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-1.5 h-4 w-4" /> Criar nova política</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar nova política</DialogTitle>
                  <DialogDescription>
                    No MVP a política é criada apenas na sessão atual, sem persistência.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pname">Nome da política</Label>
                    <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Comercial — Visitas externas" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plimit">Limite mensal (R$)</Label>
                    <Input id="plimit" inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      if (!name.trim()) {
                        toast.error("Informe o nome da política.");
                        return;
                      }
                      await policyService.create({
                        name,
                        active: true,
                        monthlyLimit: Number(limit || 0),
                        employees: 0,
                        rules: [],
                      });
                      toast.success(`Política "${name}" criada (simulação).`);
                      setOpen(false);
                      setName("");
                    }}
                  >
                    Criar política
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <DemoDataNotice />

      <div className="grid gap-4 lg:grid-cols-2">
        {policies?.map((p) => (
          <RhSection
            key={p.id}
            title={p.name}
            description={`Limite de ${brl(p.monthlyLimit)}/mês · ${num(p.employees)} colaboradores`}
            action={
              <Badge variant="secondary" className={p.active ? "border-0 bg-eco/15 text-eco" : "border-0"}>
                {p.active ? "Ativa" : "Inativa"}
              </Badge>
            }
          >
            <ul className="space-y-2">
              {p.rules.map((r) => (
                <li
                  key={r.modal}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  {r.allowed ? (
                    <Check className="h-4 w-4 text-eco" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium text-foreground">{r.modal}</span>
                  <span className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {r.window ? <span className="rounded-full bg-secondary px-2 py-0.5">{r.window}</span> : null}
                    {r.monthlyCap ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5">Limite {brl(r.monthlyCap)}/mês</span>
                    ) : null}
                    {r.cashbackRate ? (
                      <span className="rounded-full bg-eco/15 px-2 py-0.5 text-eco">Cashback {r.cashbackRate}%</span>
                    ) : null}
                    {r.note ? <span>{r.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>

            {can("write") ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info("Edição simulada da política.")}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await policyService.duplicate(p.id);
                    toast.success(`Cópia de "${p.name}" criada (simulação).`);
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicar
                </Button>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <Power className="h-3.5 w-3.5" />
                  <Switch
                    defaultChecked={p.active}
                    onCheckedChange={async (v) => {
                      await policyService.toggleActive(p.id);
                      toast.success(v ? "Política ativada (simulação)." : "Política desativada (simulação).");
                    }}
                  />
                </div>
              </div>
            ) : null}
          </RhSection>
        ))}
      </div>
    </div>
  );
}
