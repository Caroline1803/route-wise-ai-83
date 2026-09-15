import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRhSession } from "@/lib/rh/rbac";
import { employeeService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Gere relatórios financeiros, de utilização, por colaborador, por departamento, ESG, cashback e economia.",
      },
      { property: "og:title", content: "Relatórios — Portal RH" },
      {
        property: "og:description",
        content: "Exportação de relatórios do programa de mobilidade corporativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelatoriosPage,
});

const REPORTS = [
  { id: "financeiro", name: "Relatório financeiro", text: "Créditos comprados, utilizados e saldo por período." },
  { id: "utilizacao", name: "Relatório de utilização", text: "Viagens, modais e adesão ao benefício." },
  { id: "colaborador", name: "Relatório por colaborador", text: "Consumo individual, limites e cashback." },
  { id: "departamento", name: "Relatório por departamento", text: "Custo e comportamento por área." },
  { id: "esg", name: "Relatório ESG", text: "CO₂ evitado e participação sustentável." },
  { id: "cashback", name: "Relatório de cashback", text: "Campanhas, orçamento e retorno ao colaborador." },
  { id: "economia", name: "Relatório de economia", text: "Oportunidades identificadas e economia realizada." },
];

function RelatoriosPage() {
  const { can } = useRhSession();
  const [period, setPeriod] = useState("Setembro de 2026");
  const [department, setDepartment] = useState("all");
  const [unit, setUnit] = useState("all");

  if (!can("reports")) return <NoAccess area="os relatórios" />;

  const emit = (name: string, format: "PDF" | "Excel") =>
    toast.success(`${name} — ${format}`, {
      description: `Geração simulada para ${period}${department === "all" ? "" : ` · ${department}`}.`,
    });

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Relatórios"
        subtitle="Gere e exporte os relatórios do programa de mobilidade corporativa."
      />

      <DemoDataNotice text="Exportações simuladas no MVP: os arquivos serão gerados pelo backend quando a API estiver conectada." />

      <RhSection title="Filtros" description="Período, departamento e unidade.">
        <div className="grid gap-3 md:grid-cols-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Setembro de 2026", "3º trimestre de 2026", "Ano de 2026"].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {employeeService.departments().map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as unidades</SelectItem>
              <SelectItem value="sp">São Paulo — Matriz</SelectItem>
              <SelectItem value="cps">Campinas</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </RhSection>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <div key={r.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-semibold text-foreground">{r.name}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.text}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => emit(r.name, "PDF")}>
                <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => emit(r.name, "Excel")}>
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
