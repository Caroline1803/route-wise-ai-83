/** Lógica pura de estimativa de gastos — compartilhada entre servidor e telas. */

export type TransportMode = "public_transport" | "bus" | "metro" | "bike" | "scooter" | "99" | "uber" | "multimodal";

export interface ModeInfo {
  mode: TransportMode;
  label: string;
  costPerTrip: number;
  minutesPerTrip: number;
}

/** Custos médios de demonstração (MOCK). */
export const MODES: Record<Exclude<TransportMode, "multimodal">, ModeInfo> = {
  public_transport: { mode: "public_transport", label: "Ônibus/Metrô", costPerTrip: 5.2, minutesPerTrip: 55 },
  bus: { mode: "bus", label: "Ônibus", costPerTrip: 5.2, minutesPerTrip: 60 },
  metro: { mode: "metro", label: "Metrô", costPerTrip: 5.2, minutesPerTrip: 45 },
  bike: { mode: "bike", label: "Bicicleta", costPerTrip: 8, minutesPerTrip: 42 },
  scooter: { mode: "scooter", label: "Patinete", costPerTrip: 12, minutesPerTrip: 35 },
  "99": { mode: "99", label: "99", costPerTrip: 22, minutesPerTrip: 30 },
  uber: { mode: "uber", label: "Uber", costPerTrip: 25, minutesPerTrip: 28 },
};

export const COMPARE_MODES = ["public_transport", "bike", "scooter", "99", "uber"] as const;

export const MODE_LABEL: Record<TransportMode, string> = {
  ...Object.fromEntries(Object.values(MODES).map((m) => [m.mode, m.label])),
  multimodal: "Multimodal",
} as Record<TransportMode, string>;

export type SegmentModal = "bus" | "metro" | "train" | "scooter" | "bike" | "uber" | "99" | "walk";

export const SEGMENT_OPTIONS: { value: SegmentModal; label: string; cost: number }[] = [
  { value: "bus", label: "Ônibus", cost: 5.2 },
  { value: "metro", label: "Metrô", cost: 5.2 },
  { value: "train", label: "Trem", cost: 5.2 },
  { value: "scooter", label: "Patinete", cost: 6.5 },
  { value: "bike", label: "Bicicleta", cost: 4 },
  { value: "99", label: "99", cost: 14 },
  { value: "uber", label: "Uber", cost: 16 },
  { value: "walk", label: "A pé", cost: 0 },
];

export interface Segment {
  modal: SegmentModal;
  cost: number;
  /** Integração tarifária: trecho de trilho após ônibus sai grátis. */
  integrated?: boolean;
}

export const r2 = (n: number) => Math.round(n * 100) / 100;

export function businessDaysInMonth(date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= last; d++) {
    const wd = new Date(y, m, d).getDay();
    if (wd !== 0 && wd !== 6) count++;
  }
  return count;
}

export interface EstimateInput {
  costPerTrip: number;
  tripsPerDay: number;
  daysPerWeek: number;
  workingDaysMonth: number;
  corporateCredit: number;
}

export interface EstimateResult {
  daily_cost: number;
  weekly_cost: number;
  monthly_cost: number;
  corporate_credit: number;
  remaining_balance: number;
  personal_top_up: number;
  coverage_percentage: number;
}

export function calcEstimate(i: EstimateInput): EstimateResult {
  const daily = r2(i.costPerTrip * i.tripsPerDay);
  const weekly = r2(daily * i.daysPerWeek);
  const monthly = r2(daily * i.workingDaysMonth);
  const diff = r2(i.corporateCredit - monthly);
  return {
    daily_cost: daily,
    weekly_cost: weekly,
    monthly_cost: monthly,
    corporate_credit: r2(i.corporateCredit),
    remaining_balance: Math.max(0, diff),
    personal_top_up: Math.max(0, -diff),
    coverage_percentage: monthly <= 0 ? 100 : Math.min(100, Math.round((i.corporateCredit / monthly) * 100)),
  };
}

/** Custo de uma perna (ida) multimodal, aplicando integração tarifária. */
export function segmentsCost(segments: Segment[]): number {
  return r2(segments.reduce((s, seg) => s + (seg.integrated ? 0 : seg.cost), 0));
}

export function costPerTripFor(mode: TransportMode, segments?: Segment[]): number {
  if (mode === "multimodal") return segmentsCost(segments ?? []);
  return MODES[mode].costPerTrip;
}

export function compareCosts(tripsPerDay: number, workingDaysMonth: number) {
  return COMPARE_MODES.map((m) => ({
    mode: m,
    label: MODES[m].label,
    cost_per_trip: MODES[m].costPerTrip,
    minutes_per_trip: MODES[m].minutesPerTrip,
    monthly_cost: r2(MODES[m].costPerTrip * tripsPerDay * workingDaysMonth),
  }));
}

/** Sugestões determinísticas de economia. */
export function savingTips(p: {
  mode: TransportMode;
  tripsPerDay: number;
  daysPerWeek: number;
  workingDaysMonth: number;
  corporateCredit: number;
  monthlyCost: number;
}): string[] {
  const tips: string[] = [];
  const weeks = p.workingDaysMonth / Math.max(1, p.daysPerWeek);
  const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pt = MODES.public_transport.costPerTrip;

  if (p.mode === "uber" || p.mode === "99") {
    const car = MODES[p.mode].costPerTrip;
    const mixDays = Math.max(0, p.daysPerWeek - 1);
    const mixed = r2((pt * mixDays + car * Math.min(1, p.daysPerWeek)) * p.tripsPerDay * weeks);
    tips.push(
      `Utilizando transporte público ${mixDays} dia(s) por semana e ${MODES[p.mode].label} apenas 1 dia, seu gasto estimado cai de ${brl(p.monthlyCost)} para ${brl(mixed)} por mês.`,
    );
    // trecho final de carro (~60% do valor) trocado por patinete em 3 dias
    const lastLegSaving = r2((car * 0.6 - SEGMENT_OPTIONS[3]!.cost) * 1 * Math.min(3, p.daysPerWeek) * weeks);
    if (lastLegSaving > 0)
      tips.push(
        `Se você trocar o trecho final de ${MODES[p.mode].label} por patinete em ${Math.min(3, p.daysPerWeek)} dias da semana, sua economia estimada será de ${brl(lastLegSaving)} por mês.`,
      );
  }
  if (p.mode === "scooter" || p.mode === "bike") {
    const pub = r2(pt * p.tripsPerDay * p.workingDaysMonth);
    tips.push(`Em dias de chuva, combine com ônibus/metrô: só transporte público custaria ${brl(pub)} por mês.`);
  }
  if (p.monthlyCost > p.corporateCredit) {
    const cheapest = compareCosts(p.tripsPerDay, p.workingDaysMonth).find((c) => c.monthly_cost <= p.corporateCredit);
    if (cheapest)
      tips.push(`${cheapest.label} cabe no seu benefício: ${brl(cheapest.monthly_cost)} por mês, sem complemento pessoal.`);
  } else {
    tips.push(`Você ainda terá ${brl(r2(p.corporateCredit - p.monthlyCost))} de crédito sobrando — pode usar em viagens extras.`);
  }
  return tips;
}
