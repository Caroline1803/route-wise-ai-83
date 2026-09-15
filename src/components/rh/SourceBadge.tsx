import { cn } from "@/lib/utils";
import type { DataSource } from "@/lib/rh/types";

const STYLES: Record<DataSource, string> = {
  LIVE: "bg-eco/15 text-eco border-eco/30",
  SANDBOX: "bg-warning/15 text-warning border-warning/30",
  MOCK: "bg-warning/15 text-warning border-warning/30",
};

const DOT: Record<DataSource, string> = {
  LIVE: "bg-eco",
  SANDBOX: "bg-warning",
  MOCK: "bg-warning",
};

export function SourceBadge({ source, className }: { source: DataSource; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        STYLES[source],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[source])} />
      {source}
    </span>
  );
}
