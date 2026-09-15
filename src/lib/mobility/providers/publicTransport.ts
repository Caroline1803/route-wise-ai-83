import type {
  Availability,
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "../types";
import { haversineKm, round2, seed } from "../geo";

/**
 * PublicTransportAdapter
 *
 * Preparado para consumir feeds nos padrões abertos GTFS e GTFS-Realtime
 * (GTFS_FEED_URL / GTFS_REALTIME_URL). Operadores como SPTrans, Metrô, CPTM e
 * EMTU podem ser plugados futuramente, desde que existam feeds/acordos válidos.
 * Nenhum endpoint dessas organizações é presumido ou inventado aqui.
 */

export class PublicTransportMockProvider implements MobilityProvider {
  readonly id = "PUBLIC_TRANSPORT" as const;

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const km = haversineKm(origin, destination);
    const s = seed(origin, destination, 5);
    const fare = 5.2;

    const metroMin = Math.max(12, Math.round(km * 2.1 + 10 + s * 5));
    const busMin = Math.max(15, Math.round(km * 3.2 + 12 + s * 8));
    const trainMin = Math.max(18, Math.round(km * 2.4 + 14 + s * 6));

    return [
      {
        id: "pt-metro",
        provider: "PUBLIC_TRANSPORT",
        modal: "METRO",
        productName: "Metrô — linha direta",
        estimatedPrice: fare,
        currency: "BRL",
        estimatedTimeMinutes: metroMin,
        etaMinutes: Math.max(1, Math.round(2 + s * 5)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(fare * 0.03),
        co2Kg: round2(km * 0.028),
        available: true,
        corporateEligible: true,
        dataSource: "MOCK",
      },
      {
        id: "pt-bus",
        provider: "PUBLIC_TRANSPORT",
        modal: "BUS",
        productName: "Ônibus municipal",
        estimatedPrice: fare,
        currency: "BRL",
        estimatedTimeMinutes: busMin,
        etaMinutes: Math.max(2, Math.round(4 + s * 8)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(fare * 0.03),
        co2Kg: round2(km * 0.068),
        available: true,
        corporateEligible: true,
        dataSource: "MOCK",
      },
      {
        id: "pt-bus-metro",
        provider: "PUBLIC_TRANSPORT",
        modal: "MULTIMODAL",
        productName: "Ônibus + Metrô",
        estimatedPrice: round2(fare + 2),
        currency: "BRL",
        estimatedTimeMinutes: Math.round((busMin + metroMin) / 1.7),
        etaMinutes: Math.max(2, Math.round(3 + s * 6)),
        distanceKm: round2(km),
        transfers: 1,
        cashback: round2((fare + 2) * 0.03),
        co2Kg: round2(km * 0.045),
        available: true,
        corporateEligible: true,
        dataSource: "MOCK",
        segments: [
          {
            modal: "BUS",
            provider: "PUBLIC_TRANSPORT",
            description: "Ônibus até a estação",
            duration: Math.round(busMin * 0.4),
            price: fare,
          },
          {
            modal: "METRO",
            provider: "PUBLIC_TRANSPORT",
            description: "Metrô até o destino",
            duration: Math.round(metroMin * 0.7),
            price: 2,
          },
        ],
      },
      {
        id: "pt-train",
        provider: "PUBLIC_TRANSPORT",
        modal: "TRAIN",
        productName: "Trem metropolitano",
        estimatedPrice: fare,
        currency: "BRL",
        estimatedTimeMinutes: trainMin,
        etaMinutes: Math.max(3, Math.round(6 + s * 9)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(fare * 0.03),
        co2Kg: round2(km * 0.025),
        available: km > 4,
        corporateEligible: true,
        dataSource: "MOCK",
      },
    ];
  }

  async getAvailability(_location?: Location): Promise<Availability> {
    return {
      available: true,
      details: "Operação normal, sem alertas registrados",
      dataSource: "MOCK",
    };
  }

  async getStatus(): Promise<ProviderStatus> {
    return { provider: "PUBLIC_TRANSPORT", healthy: true, dataSource: "MOCK" };
  }
}

export class PublicTransportAdapter implements MobilityProvider {
  readonly id = "PUBLIC_TRANSPORT" as const;
  private fallback = new PublicTransportMockProvider();

  private live(): boolean {
    return Boolean(process.env["GTFS_FEED_URL"]);
  }

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    return this.fallback.getEstimate(origin, destination);
  }

  async getAvailability(location: Location): Promise<Availability> {
    return this.fallback.getAvailability(location);
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      provider: "PUBLIC_TRANSPORT",
      healthy: true,
      dataSource: this.live() ? "SANDBOX" : "MOCK",
      message: this.live()
        ? "Feed GTFS configurado."
        : "Sem feed GTFS/GTFS-Realtime configurado.",
    };
  }
}
