import type { MobilityOption, Modal } from "./types";
import { round2 } from "./geo";

/**
 * Compõe rotas multimodais a partir das opções normalizadas retornadas pelo
 * gateway. Cada trecho é representado separadamente em `segments`.
 */

const COMBOS: { first: Modal; second: Modal; label: string }[] = [
  { first: "METRO", second: "BIKE", label: "Metrô + Bicicleta" },
  { first: "BIKE", second: "METRO", label: "Bicicleta + Metrô" },
  { first: "METRO", second: "RIDE_HAILING", label: "Metrô + Carro por app" },
  { first: "TRAIN", second: "BIKE", label: "Trem + Bicicleta" },
];

function pick(options: MobilityOption[], modal: Modal) {
  return options
    .filter((o) => o.modal === modal && o.available)
    .sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0];
}

export function buildMultimodalRoutes(options: MobilityOption[]): MobilityOption[] {
  const routes: MobilityOption[] = [];

  for (const combo of COMBOS) {
    const a = pick(options, combo.first);
    const b = pick(options, combo.second);
    if (!a || !b) continue;

    const firstShare = 0.62;
    const secondShare = 0.42;
    const durationA = Math.max(5, Math.round(a.estimatedTimeMinutes * firstShare));
    const durationB = Math.max(5, Math.round(b.estimatedTimeMinutes * secondShare));
    const priceA = round2(a.estimatedPrice * (a.modal === "RIDE_HAILING" ? 0.5 : 1));
    const priceB = round2(b.estimatedPrice * (b.modal === "RIDE_HAILING" ? 0.5 : 1));

    routes.push({
      id: `mm-${combo.first}-${combo.second}`.toLowerCase(),
      provider: a.provider,
      modal: "MULTIMODAL",
      productName: combo.label,
      estimatedPrice: round2(priceA + priceB),
      currency: "BRL",
      estimatedTimeMinutes: durationA + durationB + 4,
      etaMinutes: a.etaMinutes,
      distanceKm: a.distanceKm,
      transfers: 1,
      cashback: round2((a.cashback ?? 0) + (b.cashback ?? 0)),
      co2Kg: round2(((a.co2Kg ?? 0) + (b.co2Kg ?? 0)) / 2),
      available: true,
      corporateEligible: a.corporateEligible && b.corporateEligible,
      dataSource: a.dataSource === b.dataSource ? a.dataSource : "MOCK",
      segments: [
        {
          modal: combo.first,
          provider: a.provider,
          description: a.productName,
          duration: durationA,
          price: priceA,
        },
        {
          modal: combo.second,
          provider: b.provider,
          description: b.productName,
          duration: durationB,
          price: priceB,
        },
      ],
    });
  }

  return routes;
}
