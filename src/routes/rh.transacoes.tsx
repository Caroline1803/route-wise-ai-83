import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { SourceBadge } from "@/components/rh/SourceBadge";
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
import { brl, dateTime } from "@/lib/rh/format";
import { useRhSession } from "@/lib/rh/rbac";
import { employeeService, transactionService } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/transacoes")({
  head: () => ({
    meta: [
      { title: "Transações — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Consulte, filtre e exporte todas as transações de mobilidade dos colaboradores da empresa.",
      },
      { property: "og:title", content: "Transações — Portal RH" },
      {
        property: "og:description",
        content: "Histórico completo de viagens, valores, cashback e origem do dado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransacoesPage,
});

const STATUS_CLASS = {
  CONFIRMADA: "bg-eco/15 text-eco",
  PENDENTE: "bg-warning/15 text-warning",
  ESTORNADA: "bg-destructive/15 text-destructive",
} as const;

function TransacoesPage() {
  const { can } = useRhSession();
  const [employee, setEmployee] = useState("all");
  const [modal, setModal] = useState("all");
  const [status, setStatus] = useState("all");
  const [minAmount, setMinAmount] = useState("");

  const { data: rows } = useQuery({
    queryKey: ["rh", "transactions", employee, modal, status, minAmount],
    queryFn: () =>
      transactionService.list({
        employee,
        modal,
        status,
        minAmount: minAmount ? Number(minAmount) : 0,
      }),
  });

  if (!can("transactions")) return <NoAccess area="as transações" />;

  const download = () => {
    const csv = transactionService.toCsv(rows ?? []);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes-mobilidade.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  };

  return (
    <div className="space-y-6">
      <RhPageHeader
        title="Transações"
        subtitle="Todas as viagens pagas com créditos corporativos no período."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download}>
              <Download className="mr-1.5 h-4 w-4" /> Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("Geração de relatório em PDF disponível na tela Relatórios.")}
            >
              <FileText className="mr-1.5 h-4 w-4" /> Exportar relatório
            </Button>
          </div>
        }
      />

      <DemoDataNotice />

      <RhSection title="Filtros" description="Período, colaborador, modal, valor e status.">
        <div className="grid gap-3 lg:grid-cols-4">
          <Select value={employee} onValueChange={setEmployee}>
            <SelectTrigger><SelectValue placeholder="Colaborador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {employeeService.departments().length > 0 &&
                [...new Set((rows ?? []).map((t) => t.employeeName))].map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={modal} onValueChange={setModal}>
            <SelectTrigger><SelectValue placeholder="Modal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modais</SelectItem>
              {["Metrô", "Ônibus", "Trem", "Bicicleta", "Uber", "99"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="ESTORNADA">Estornada</SelectItem>
            </SelectContent>
          </Select>
          <Input
            inputMode="decimal"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Valor mínimo (R$)"
          />
        </div>
      </RhSection>

      <RhSection title={`${rows?.length ?? 0} transações`} description="Setembro de 2026.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Colaborador</th>
                <th className="pb-3 font-medium">Modal</th>
                <th className="pb-3 font-medium">Origem</th>
                <th className="pb-3 font-medium">Destino</th>
                <th className="pb-3 text-right font-medium">Valor</th>
                <th className="pb-3 text-right font-medium">Cashback</th>
                <th className="pb-3 font-medium">Fonte</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-2.5 text-muted-foreground">{dateTime(t.date)}</td>
                  <td className="py-2.5 text-foreground">{t.employeeName}</td>
                  <td className="py-2.5 text-foreground">{t.modal}</td>
                  <td className="py-2.5 text-muted-foreground">{t.origin}</td>
                  <td className="py-2.5 text-muted-foreground">{t.destination}</td>
                  <td className="py-2.5 text-right text-foreground">{brl(t.amount)}</td>
                  <td className="py-2.5 text-right text-eco">{brl(t.cashback)}</td>
                  <td className="py-2.5"><SourceBadge source={t.source} /></td>
                  <td className="py-2.5">
                    <Badge variant="secondary" className={`border-0 ${STATUS_CLASS[t.status]}`}>
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
              {rows?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
                    Nenhuma transação encontrada com esses filtros.
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
