import type {
  Availability,
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "../types";
import { haversineKm, round2, seed } from "../geo";

/**
 * NinetyNineAdapter (99)
 *
 * Não assumimos a existência de uma API pública adequada. A arquitetura está
 * pronta para receber documentação e credenciais oficiais (NINETY_NINE_API_KEY /
 * NINETY_NINE_API_BASE_URL). Até lá, todos os dados vêm do mock e são marcados
 * explicitamente como "MOCK".
 */

export class NinetyNineMockProvider implements MobilityProvider {
  readonly id = "99" as const;

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const km = haversineKm(origin, destination);
    const s = seed(origin, destination, 2);
    const minutes = Math.max(9, Math.round(km * 2.7 + 7 + s * 5));
    const base = 5.9 + km * 2.7 + s * 3.5;

    return [
      {
        id: "99-pop",
        provider: "99",
        modal: "RIDE_HAILING",
        productName: "99Pop",
        estimatedPrice: round2(base),
        currency: "BRL",
        estimatedTimeMinutes: minutes,
        etaMinutes: Math.max(2, Math.round(4 + s * 5)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(base * 0.01),
        co2Kg: round2(km * 0.171),
        available: true,
        corporateEligible: true,
        dataSource: "MOCK",
      },
      {
        id: "99-comfort",
        provider: "99",
        modal: "RIDE_HAILING",
        productName: "99Comfort",
        estimatedPrice: round2(base * 1.28),
        currency: "BRL",
        estimatedTimeMinutes: minutes + 1,
        etaMinutes: Math.max(3, Math.round(5 + s * 5)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(base * 1.28 * 0.01),
        co2Kg: round2(km * 0.171),
        available: true,
        corporateEligible: true,
        dataSource: "MOCK",
      },
    ];
  }

  async getAvailability(): Promise<Availability> {
    return { available: true, dataSource: "MOCK" };
  }

  async getStatus(): Promise<ProviderStatus> {
    return { provider: "99", healthy: true, dataSource: "MOCK" };
  }
}

export class NinetyNineAdapter implements MobilityProvider {
  readonly id = "99" as const;
  private fallback = new NinetyNineMockProvider();

  private live(): boolean {
    return Boolean(
      process.env["NINETY_NINE_API_KEY"] && process.env["NINETY_NINE_API_BASE_URL"],
    );
  }

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    return this.fallback.getEstimate(origin, destination);
  }

  async getAvailability(location: Location): Promise<Availability> {
    return this.fallback.getAvailability(location);
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      provider: "99",
      healthy: true,
      dataSource: this.live() ? "SANDBOX" : "MOCK",
      message: "Aguardando documentação e credenciais oficiais da 99.",
    };
  }
}
