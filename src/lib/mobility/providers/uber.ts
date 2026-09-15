import type {
  Availability,
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "../types";
import { haversineKm, round2, seed } from "../geo";

/**
 * UberAdapter
 *
 * Integração real só é ativada quando UBER_CLIENT_ID / UBER_CLIENT_SECRET /
 * UBER_REDIRECT_URI estiverem configurados no backend E houver permissão
 * concedida pela Uber. Nenhum endpoint é inventado aqui: enquanto não houver
 * documentação/credenciais oficiais liberadas, o adapter delega para o
 * UberMockProvider e marca dataSource = "MOCK".
 */

function hasUberCredentials(): boolean {
  return Boolean(
    process.env["UBER_CLIENT_ID"] &&
      process.env["UBER_CLIENT_SECRET"] &&
      process.env["UBER_REDIRECT_URI"],
  );
}

/** Tradução de falhas HTTP para mensagens operacionais do gateway. */
export function mapProviderHttpError(status: number): string {
  switch (status) {
    case 401:
      return "Credenciais inválidas ou token expirado.";
    case 403:
      return "Escopo não autorizado para esta operação.";
    case 429:
      return "Limite de requisições atingido (rate limit).";
    default:
      return status >= 500 ? "Serviço temporariamente indisponível." : `Erro ${status}.`;
  }
}

export class UberMockProvider implements MobilityProvider {
  readonly id = "UBER" as const;

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    const km = haversineKm(origin, destination);
    const s = seed(origin, destination, 1);
    const minutes = Math.max(8, Math.round(km * 2.6 + 6 + s * 6));
    const base = 6.5 + km * 2.9 + s * 4;

    const make = (
      name: string,
      mult: number,
      etaOffset: number,
      idx: number,
    ): MobilityOption => ({
      id: `uber-${idx}`,
      provider: "UBER",
      modal: "RIDE_HAILING",
      productName: name,
      estimatedPrice: round2(base * mult),
      currency: "BRL",
      estimatedTimeMinutes: minutes,
      etaMinutes: Math.max(2, Math.round(3 + s * 4) + etaOffset),
      distanceKm: round2(km),
      transfers: 0,
      cashback: round2(base * mult * 0.01),
      co2Kg: round2(km * 0.171),
      available: true,
      corporateEligible: true,
      dataSource: "MOCK",
    });

    return [make("UberX", 1, 0, 1), make("Uber Comfort", 1.32, 2, 2)];
  }

  async getAvailability(): Promise<Availability> {
    return { available: true, details: "Carros na região", dataSource: "MOCK" };
  }

  async getStatus(): Promise<ProviderStatus> {
    return { provider: "UBER", healthy: true, dataSource: "MOCK" };
  }
}

export class UberAdapter implements MobilityProvider {
  readonly id = "UBER" as const;
  private fallback = new UberMockProvider();

  private live(): boolean {
    return hasUberCredentials();
  }

  async getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]> {
    if (!this.live()) return this.fallback.getEstimate(origin, destination);
    // Ponto de extensão: chamada autenticada OAuth 2.0 à API oficial da Uber.
    // Mantido inativo até credenciais e documentação oficiais estarem disponíveis.
    return this.fallback.getEstimate(origin, destination);
  }

  async getAvailability(location: Location): Promise<Availability> {
    return this.fallback.getAvailability(location);
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      provider: "UBER",
      healthy: true,
      dataSource: this.live() ? "SANDBOX" : "MOCK",
      message: this.live()
        ? "Credenciais presentes — aguardando liberação de escopo oficial."
        : "Sem credenciais configuradas: usando simulação do MVP.",
    };
  }
}
