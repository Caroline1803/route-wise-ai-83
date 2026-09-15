import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { brl, brlCompact } from "@/lib/rh/format";
import {
  mockCashback,
  mockDashboardData,
  mockEmployees,
  mockEsg,
  mockIntelligence,
} from "@/lib/rh/mock/data";

/**
 * Assistente do RH.
 * Responde apenas com dados já disponíveis no sistema e NUNCA executa
 * alterações de saldo, crédito ou política — ações exigem confirmação
 * do gestor nas telas correspondentes.
 */

const SUGGESTIONS = [
  "Quanto gastamos com Uber este mês?",
  "Qual departamento utiliza mais transporte público?",
  "Quanto podemos economizar no próximo mês?",
  "Qual modal gera maior custo?",
  "Como aumentar a utilização de transporte sustentável?",
  "Quantos colaboradores estão com saldo ocioso?",
];

interface Message {
  role: "user" | "ai";
  text: string;
}

function answer(question: string): string {
  const q = question.toLowerCase();
  const d = mockDashboardData;

  if (/(alterar|mudar|aumentar|bloquear).*(saldo|limite|política|politica|crédito|credito)/.test(q)) {
    return "Não posso alterar saldos, créditos ou políticas por aqui. Posso preparar a simulação, mas a mudança precisa ser confirmada por um RH Administrador nas telas de Créditos ou Políticas.";
  }
  if (q.includes("uber")) {
    const uber = d.modalShare.find((m) => m.modal === "Uber");
    return `Uber representa ${uber?.share}% das viagens do mês, com custo de ${brlCompact(uber?.cost ?? 0)}. Somando 99, o transporte individual chega a ${brlCompact((uber?.cost ?? 0) + (d.modalShare.find((m) => m.modal === "99")?.cost ?? 0))}.`;
  }
  if (q.includes("público") || q.includes("publico") || q.includes("metrô") || q.includes("metro")) {
    const top = [...mockEmployees].sort((a, b) => b.used - a.used);
    const dep = top.find((e) => e.mainModal.includes("Metrô"))?.department ?? "Tecnologia";
    return `O transporte público concentra 52% das viagens (${brlCompact(185_536)}). Entre os departamentos monitorados, ${dep} é o que mais utiliza, seguido por Operações.`;
  }
  if (q.includes("economiz")) {
    const f = mockIntelligence.forecast;
    return `A MaaS Intelligence estima ${brlCompact(mockIntelligence.potentialSaving)}/mês de economia potencial. A previsão de gasto do próximo mês é ${brlCompact(f.nextMonth)} (intervalo ${brlCompact(f.low)} – ${brlCompact(f.high)}) — é uma estimativa, não um valor garantido.`;
  }
  if (q.includes("maior custo") || q.includes("modal") ) {
    const top = [...d.modalShare].sort((a, b) => b.cost - a.cost)[0]!;
    return `O maior custo é ${top.modal}: ${brlCompact(top.cost)} (${top.share}% das viagens).`;
  }
  if (q.includes("sustent") || q.includes("bicicleta") || q.includes("co2") || q.includes("co₂")) {
    return `A participação sustentável está em ${mockEsg.sustainableShare}% (+${mockEsg.evolution}%), com ${mockEsg.co2AvoidedTons} t de CO₂ evitadas. A campanha "${mockCashback.campaigns[0]?.name}" elevou o uso de bicicleta em 12% — ampliar o cashback de bicicleta e transporte público tende a manter a curva.`;
  }
  if (q.includes("ocios") || q.includes("saldo")) {
    const idle = mockEmployees.filter((e) => e.balance / e.monthlyLimit > 0.4);
    return `${idle.length} colaboradores da amostra terminam o mês com mais de 40% do benefício disponível (14% da base). Saldo ocioso somado na amostra: ${brl(idle.reduce((s, e) => s + e.balance, 0))}.`;
  }
  return `Posso responder sobre gastos por modal, economia potencial, cashback, saldo ocioso e indicadores ESG deste período. Hoje temos ${brlCompact(d.kpis.creditsUsed)} utilizados de ${brlCompact(d.kpis.creditsIssued)} distribuídos.`;
}

export function RhAiAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Olá! Sou a MaaS AI. Respondo com base nos dados do seu programa de mobilidade. Não altero saldos nem políticas — isso exige confirmação de um administrador.",
    },
  ]);
  const [input, setInput] = useState("");

  const ask = (question: string) => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "ai", text: answer(question) }]);
    setInput("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Sparkles className="h-4 w-4 text-primary" /> Pergunte à MaaS AI
          </SheetTitle>
          <SheetDescription>
            Consultas sobre os dados do período. Sem permissão para alterar saldos ou políticas.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "ai"
                  ? "rounded-2xl rounded-tl-sm bg-secondary p-3 text-sm text-secondary-foreground"
                  : "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary p-3 text-sm text-primary-foreground"
              }
            >
              {m.text}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          className="flex items-center gap-2 border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre gastos, economia, ESG…"
          />
          <Button type="submit" size="icon" aria-label="Enviar pergunta">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
