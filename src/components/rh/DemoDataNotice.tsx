import { Info } from "lucide-react";

/** Deixa explícito que a tela usa a camada de demonstração do MVP. */
export function DemoDataNotice({ text }: { text?: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border bg-secondary/60 p-3 text-xs text-secondary-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {text ??
        "Dados de demonstração do MVP. Nenhum pagamento real é processado e nenhuma integração simulada é apresentada como oficial."}
    </p>
  );
}
