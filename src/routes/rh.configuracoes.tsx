import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ROLE_DESCRIPTION, ROLE_LABEL, useRhSession } from "@/lib/rh/rbac";
import type { RhRole } from "@/lib/rh/types";

export const Route = createFileRoute("/rh/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Dados da empresa, perfis de acesso (RBAC) e preferências de notificação do Portal RH.",
      },
      { property: "og:title", content: "Configurações — Portal RH" },
      {
        property: "og:description",
        content: "Gestão de perfis, permissões e preferências do portal corporativo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { can, session, setRole } = useRhSession();

  if (!can("settings")) return <NoAccess area="as configurações" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Configurações"
        subtitle="Dados da empresa, perfis de acesso e preferências do portal."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <RhSection title="Empresa" description="Informações usadas nos relatórios e no cabeçalho.">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Razão social</Label>
              <Input id="company" defaultValue={session.company} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade principal</Label>
              <Input id="unit" defaultValue="São Paulo — Matriz" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Período de apuração</Label>
              <Input id="period" defaultValue="Mensal — fecha no dia 30" />
            </div>
          </div>
        </RhSection>

        <RhSection title="Notificações" description="Quando o portal deve alertar a equipe de RH.">
          <div className="space-y-4">
            {[
              "Gasto acima da média dos últimos três meses",
              "Saldo corporativo abaixo de 10%",
              "Padrão incomum de utilização (análise necessária)",
              "Encerramento de campanha de cashback",
            ].map((n) => (
              <label key={n} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-foreground">{n}</span>
                <Switch defaultChecked />
              </label>
            ))}
          </div>
        </RhSection>
      </div>

      <RhSection
        title="Perfis de acesso (RBAC)"
        description="As permissões abaixo também precisam ser validadas no backend quando a API estiver conectada."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(Object.keys(ROLE_LABEL) as RhRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRole(role)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                session.role === role
                  ? "border-primary/50 bg-secondary/60"
                  : "border-border hover:bg-secondary/40"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {ROLE_LABEL[role]}
                {session.role === role ? <Check className="h-4 w-4 text-primary" /> : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{ROLE_DESCRIPTION[role]}</p>
            </button>
          ))}
        </div>
      </RhSection>
    </div>
  );
}
