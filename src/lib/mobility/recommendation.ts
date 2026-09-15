import type { MobilityOption } from "./types";

/**
 * MobilityRecommendationService
 * Score determinístico 0–100. A IA generativa NÃO participa desta decisão.
 *
 * Preço 30% · Tempo 25% · Sustentabilidade 20% · Política 15% · Cashback 10%
 */

const WEIGHTS = {
  price: 0.3,
  time: 0.25,
  sustainability: 0.2,
  policy: 0.15,
  cashback: 0.1,
};

function normalizeInverse(value: number, min: number, max: number): number {
  if (max <= min) return 1;
  return 1 - (value - min) / (max - min);
}

export function scoreOptions(options: MobilityOption[]): MobilityOption[] {
  const avail = options.filter((o) => o.available);
  if (avail.length === 0) return options;

  const prices = avail.map((o) => o.estimatedPrice);
  const times = avail.map((o) => o.estimatedTimeMinutes);
  const co2 = avail.map((o) => o.co2Kg ?? 0);
  const cashbacks = avail.map((o) => o.cashback ?? 0);

  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const maxC = Math.max(...co2);
  const maxCb = Math.max(...cashbacks);

  return options.map((o) => {
    if (!o.available) return { ...o, mobilityScore: 0 };
    const price = normalizeInverse(o.estimatedPrice, minP, maxP);
    const time = normalizeInverse(o.estimatedTimeMinutes, minT, maxT);
    const sustainability = maxC > 0 ? 1 - (o.co2Kg ?? 0) / maxC : 1;
    const policy = o.corporateEligible ? 1 : 0.15;
    const cashback = maxCb > 0 ? (o.cashback ?? 0) / maxCb : 0;

    const score =
      price * WEIGHTS.price +
      time * WEIGHTS.time +
      sustainability * WEIGHTS.sustainability +
      policy * WEIGHTS.policy +
      cashback * WEIGHTS.cashback;

    return { ...o, mobilityScore: Math.round(score * 100) };
  });
}

export function pickRecommended(options: MobilityOption[]): MobilityOption | null {
  const eligible = options
    .filter((o) => o.available && o.corporateEligible)
    .sort((a, b) => (b.mobilityScore ?? 0) - (a.mobilityScore ?? 0));
  return eligible[0] ?? null;
}
