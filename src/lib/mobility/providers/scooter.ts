import type {
  Availability,
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "../types";
import { haversineKm, round2, seed } from "../geo";

/** Patinete elétrico compartilhado — MOCK até existir API oficial autorizada. */
export class ScooterMockProvider implements MobilityProvider {
  readonly id = "SCOOTER" as const;

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const km = haversineKm(origin, destination);
    const s = seed(origin, destination, 7);
    const minutes = Math.max(5, Math.round((km / 18) * 60 + 3 + s * 3));
    const price = round2(4 + minutes * 0.5);
    return [
      {
        id: "scooter-single",
        provider: "SCOOTER",
        modal: "SCOOTER",
        productName: "Patinete elétrico",
        estimatedPrice: price,
        currency: "BRL",
        estimatedTimeMinutes: minutes,
        etaMinutes: Math.max(1, Math.round(1 + s * 3)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: 0,
        co2Kg: round2(km * 0.02),
        available: km <= 8,
        corporateEligible: true,
        dataSource: "MOCK",
      },
    ];
  }

  async getAvailability(origin: Location): Promise<Availability> {
    const s = seed(origin, origin, 8);
    return {
      available: true,
      nearestStationMeters: Math.round(60 + s * 300),
      vehiclesAvailable: Math.round(2 + s * 10),
      dataSource: "MOCK",
    };
  }

  async getStatus(): Promise<ProviderStatus> {
    return { provider: "SCOOTER", healthy: true, dataSource: "MOCK", message: "Dados simulados" };
  }
}
