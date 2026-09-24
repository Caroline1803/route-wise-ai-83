import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { employeeService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/colaboradores/")({
  head: () => ({
    meta: [
      { title: "Colaboradores — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Consulte saldos, limites, modal principal e status do benefício de mobilidade de cada colaborador.",
      },
      { property: "og:title", content: "Colaboradores — Portal RH" },
      {
        property: "og:description",
        content: "Busca, filtros e gestão da base de colaboradores do programa de mobilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ColaboradoresPage,
});

const STATUS_VARIANT = {
  ATIVO: "bg-eco/15 text-eco",
  BLOQUEADO: "bg-destructive/15 text-destructive",
  INATIVO: "bg-secondary text-muted-foreground",
} as const;

function ColaboradoresPage() {
  const { can } = useRhSession();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState("all");
  const [spendRange, setSpendRange] = useState("all");

  const { data: employees, isFetching } = useQuery({
    queryKey: ["rh", "employees", search, department, status, modal, spendRange],
    queryFn: () => employeeService.list({ search, department, status, modal, spendRange }),
  });

  if (!can("employees")) return <NoAccess area="a base de colaboradores" />;

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Colaboradores"
        subtitle="Base de beneficiários do programa de mobilidade corporativa."
        action={
          can("write") ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Importação por CSV/planilha", {
                    description: "Fluxo de demonstração do MVP — nenhum arquivo é processado.",
                  })
                }
              >
                <Upload className="mr-1.5 h-4 w-4" /> Importar colaboradores
              </Button>
              <Button asChild>
                <Link to="/rh/colaboradores/novo">
                  <Plus className="mr-1.5 h-4 w-4" /> Novo Funcionário
                </Link>
              </Button>
            </div>
          ) : null
        }
      />

      <DemoDataNotice />

      <RhSection title="Busca e filtros" description="Pesquise por nome, CPF, matrícula ou departamento.">
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome, CPF, matrícula ou departamento"
              className="pl-9"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {employeeService.departments().map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
              <SelectItem value="INATIVO">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modal} onValueChange={setModal}>
            <SelectTrigger><SelectValue placeholder="Modal principal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modais</SelectItem>
              <SelectItem value="Metrô">Metrô</SelectItem>
              <SelectItem value="Ônibus">Ônibus</SelectItem>
              <SelectItem value="Trem">Trem</SelectItem>
              <SelectItem value="Bike">Bicicleta</SelectItem>
              <SelectItem value="Uber">Uber</SelectItem>
            </SelectContent>
          </Select>
          <Select value={spendRange} onValueChange={setSpendRange}>
            <SelectTrigger><SelectValue placeholder="Faixa de gastos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer gasto</SelectItem>
              <SelectItem value="0-200">Até R$ 200</SelectItem>
              <SelectItem value="200-450">R$ 200 a R$ 450</SelectItem>
              <SelectItem value="450-9999">Acima de R$ 450</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </RhSection>

      <RhSection
        title={`${employees?.length ?? 0} colaboradores`}
        description="Clique em um colaborador para abrir o perfil completo."
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 pb-3 font-medium">Colaborador</th>
                <th className="px-2 pb-3 font-medium">Área</th>
                <th className="px-2 pb-3 font-medium">Saldo</th>
                <th className="px-2 pb-3 font-medium">Utilizado</th>
                <th className="px-2 pb-3 font-medium">Modal principal</th>
                <th className="px-2 pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((e) => (
                <tr key={e.id} className="border-t border-border transition-colors hover:bg-secondary/40">
                  <td className="px-2 py-3">
                    <Link
                      to="/rh/colaboradores/$id"
                      params={{ id: e.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {e.name}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{e.registration}</span>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">{e.department}</td>
                  <td className="px-2 py-3 text-foreground">{brl(e.balance)}</td>
                  <td className="px-2 py-3 text-foreground">{brl(e.used)}</td>
                  <td className="px-2 py-3 text-muted-foreground">{e.mainModal}</td>
                  <td className="px-2 py-3">
                    <Badge className={`${STATUS_VARIANT[e.status]} border-0`} variant="secondary">
                      {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!isFetching && employees?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center text-muted-foreground">
                    Nenhum colaborador encontrado com esses filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </RhSection>
    </div>
  );
}
