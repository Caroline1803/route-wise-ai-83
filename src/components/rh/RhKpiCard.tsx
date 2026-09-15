import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  hint?: string;
  delta?: { value: number; label: string; positive: boolean };
  icon?: ReactNode;
  accent?: "default" | "eco" | "warning";
}

export function RhKpiCard({ label, value, hint, delta, icon, accent = "default" }: Props) {
  const Arrow = delta && delta.value < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="rounded-lg border border-border bg-card/90 p-5 shadow-soft backdrop-blur transition-colors hover:border-primary/35">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md bg-secondary text-secondary-foreground",
              accent === "eco" && "bg-eco/15 text-eco",
              accent === "warning" && "bg-warning/15 text-warning",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-2xl font-bold text-foreground",
          accent === "eco" && "text-eco",
        )}
      >
        {value}
      </p>
      {delta ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium",
            delta.positive ? "text-eco" : "text-destructive",
          )}
        >
          <Arrow className="h-3.5 w-3.5" />
          {delta.value > 0 ? "+" : ""}
          {delta.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% {delta.label}
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
