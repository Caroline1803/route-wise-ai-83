import type {
  Availability,
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "../types";
import { haversineKm, round2, seed } from "../geo";

/**
 * BikeAdapter
 *
 * Suporta feeds públicos no padrão GBFS quando GBFS_FEED_URL estiver
 * configurada (station_information / station_status são endpoints do próprio
 * padrão aberto, descobertos a partir do gbfs.json do operador). Sem feed
 * configurado, usa BikeMockProvider.
 */

interface GbfsStationStatus {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
}

export class BikeMockProvider implements MobilityProvider {
  readonly id = "BIKE" as const;

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const km = haversineKm(origin, destination);
    const s = seed(origin, destination, 3);
    const minutes = Math.max(6, Math.round((km / 14) * 60 + 4 + s * 4));
    const price = round2(3.5 + Math.min(9, km * 0.9));

    return [
      {
        id: "bike-single",
        provider: "BIKE",
        modal: "BIKE",
        productName: "Bicicleta compartilhada",
        estimatedPrice: price,
        currency: "BRL",
        estimatedTimeMinutes: minutes,
        etaMinutes: Math.max(1, Math.round(2 + s * 4)),
        distanceKm: round2(km),
        transfers: 0,
        cashback: round2(price * 0.05),
        co2Kg: 0,
        available: km <= 12,
        corporateEligible: true,
        dataSource: "MOCK",
      },
    ];
  }

  async getAvailability(origin: Location): Promise<Availability> {
    const s = seed(origin, origin, 4);
    return {
      available: true,
      nearestStationMeters: Math.round(120 + s * 600),
      vehiclesAvailable: Math.round(3 + s * 12),
      docksAvailable: Math.round(4 + s * 14),
      details: "Estação próxima com bicicletas disponíveis",
      dataSource: "MOCK",
    };
  }

  async getStatus(): Promise<ProviderStatus> {
    return { provider: "BIKE", healthy: true, dataSource: "MOCK" };
  }
}

export class BikeAdapter implements MobilityProvider {
  readonly id = "BIKE" as const;
  private fallback = new BikeMockProvider();

  private feedUrl(): string | undefined {
    return process.env["GBFS_FEED_URL"];
  }

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const options = await this.fallback.getEstimate(origin, destination);
    const availability = await this.getAvailability(origin);
    return options.map((o) => ({
      ...o,
      available: o.available && availability.available,
      dataSource: availability.dataSource,
    }));
  }

  async getAvailability(location: Location): Promise<Availability> {
    const url = this.feedUrl();
    if (!url) return this.fallback.getAvailability(location);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url.replace(/\/$/, "")}/station_status.json`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return this.fallback.getAvailability(location);
      const json = (await res.json()) as {
        data?: { stations?: GbfsStationStatus[] };
      };
      const stations = json.data?.stations ?? [];
      const bikes = stations.reduce((a, s) => a + (s.num_bikes_available ?? 0), 0);
      const docks = stations.reduce((a, s) => a + (s.num_docks_available ?? 0), 0);
      return {
        available: bikes > 0,
        vehiclesAvailable: bikes,
        docksAvailable: docks,
        details: `${stations.length} estações no feed GBFS`,
        dataSource: "LIVE",
      };
    } catch {
      return this.fallback.getAvailability(location);
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      provider: "BIKE",
      healthy: true,
      dataSource: this.feedUrl() ? "LIVE" : "MOCK",
      message: this.feedUrl() ? "Feed GBFS configurado." : "Sem feed GBFS configurado.",
    };
  }
}
