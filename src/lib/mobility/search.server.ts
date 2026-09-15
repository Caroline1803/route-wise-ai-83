import { collectOptions } from "./gateway";
import { buildMultimodalRoutes } from "./multimodal";
import { pickRecommended, scoreOptions } from "./recommendation";
import {
  DEFAULT_WALLET,
  applyCashback,
  applyCorporatePolicy,
  estimateSavings,
} from "./policy";
import { generateExplanation } from "./explain";
import type { SearchRequest, SearchResponse } from "./types";

/** Orquestração completa da busca multimodal (executa somente no backend). */
export async function runMobilitySearch(input: SearchRequest): Promise<SearchResponse> {
  const hour = input.hourOfDay ?? new Date().getHours();
  const wallet = DEFAULT_WALLET;

  const { options: raw, statuses } = await collectOptions(input.origin, input.destination);
  const withRoutes = [...raw, ...buildMultimodalRoutes(raw)];

  const carBaseline = Math.max(
    0,
    ...withRoutes
      .filter((o) => o.modal === "RIDE_HAILING")
      .map((o) => o.estimatedPrice),
  );

  const processed = withRoutes
    .map(applyCashback)
    .map((o) => applyCorporatePolicy(o, wallet, hour))
    .map((o) => ({ ...o, savingsVsCar: estimateSavings(o, carBaseline) }));

  const scored = scoreOptions(processed).sort(
    (a, b) => (b.mobilityScore ?? 0) - (a.mobilityScore ?? 0),
  );
  const recommended = pickRecommended(scored);
  const explanation = await generateExplanation(recommended);

  return {
    requestId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    wallet,
    recommended,
    explanation,
    options: scored,
    providers: statuses,
  };
}

export function validateSearchInput(value: unknown): SearchRequest {
  const v = value as Partial<SearchRequest> | null;
  const isLoc = (l: unknown): l is { latitude: number; longitude: number } =>
    typeof l === "object" &&
    l !== null &&
    typeof (l as { latitude?: unknown }).latitude === "number" &&
    typeof (l as { longitude?: unknown }).longitude === "number";

  if (!v || !isLoc(v.origin) || !isLoc(v.destination)) {
    throw new Error("origin e destination com latitude/longitude são obrigatórios");
  }
  return {
    origin: v.origin,
    destination: v.destination,
    ...(typeof v.hourOfDay === "number" ? { hourOfDay: v.hourOfDay } : {}),
  };
}
