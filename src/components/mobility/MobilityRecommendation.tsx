import type { MobilityOption } from "@/lib/mobility/types";
import { OptionCard } from "./OptionCard";

/** Recomendação determinística do backend + explicação em linguagem natural. */
export function MobilityRecommendation({
  option,
  explanation,
  selected,
  onSelect,
}: {
  option: MobilityOption;
  explanation: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        ✨ Recomendado pela MaaS AI
      </h2>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <OptionCard option={option} highlighted selected={selected} />
      </button>
      <p className="mt-3 rounded-xl border border-border bg-accent/40 p-4 text-sm text-accent-foreground">
        <strong className="font-semibold">MaaS AI:</strong> {explanation}
      </p>
    </section>
  );
}
