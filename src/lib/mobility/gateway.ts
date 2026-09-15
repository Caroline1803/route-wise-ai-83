import type {
  Location,
  MobilityOption,
  MobilityProvider,
  ProviderStatus,
} from "./types";
import { UberAdapter } from "./providers/uber";
import { NinetyNineAdapter } from "./providers/ninetynine";
import { BikeAdapter } from "./providers/bike";
import { PublicTransportAdapter } from "./providers/publicTransport";

/**
 * Mobility Gateway
 * Consulta todos os providers em paralelo com timeout, retry controlado,
 * cache curto e circuit breaker. A falha de um provider nunca impede o
 * retorno dos demais.
 */

const TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 30_000;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60_000;

interface CacheEntry {
  at: number;
  options: MobilityOption[];
}

const cache = new Map<string, CacheEntry>();
const failures = new Map<string, { count: number; openedAt: number }>();

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function breakerOpen(id: string): boolean {
  const f = failures.get(id);
  if (!f || f.count < BREAKER_THRESHOLD) return false;
  if (Date.now() - f.openedAt > BREAKER_COOLDOWN_MS) {
    failures.delete(id);
    return false;
  }
  return true;
}

function key(id: string, o: Location, d: Location) {
  return `${id}:${o.latitude.toFixed(4)},${o.longitude.toFixed(4)}->${d.latitude.toFixed(4)},${d.longitude.toFixed(4)}`;
}

export function getProviders(): MobilityProvider[] {
  return [
    new UberAdapter(),
    new NinetyNineAdapter(),
    new BikeAdapter(),
    new PublicTransportAdapter(),
  ];
}

export interface GatewayResult {
  options: MobilityOption[];
  statuses: ProviderStatus[];
}

export async function collectOptions(
  origin: Location,
  destination: Location,
): Promise<GatewayResult> {
  const providers = getProviders();

  const results = await Promise.all(
    providers.map(async (provider): Promise<GatewayResult> => {
      const started = Date.now();
      const status = await provider.getStatus().catch(
        (): ProviderStatus => ({
          provider: provider.id,
          healthy: false,
          dataSource: "MOCK",
        }),
      );

      if (breakerOpen(provider.id)) {
        return {
          options: [],
          statuses: [
            {
              ...status,
              healthy: false,
              message: "Temporariamente indisponível (circuit breaker aberto).",
            },
          ],
        };
      }

      const cacheKey = key(provider.id, origin, destination);
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return {
          options: cached.options,
          statuses: [{ ...status, latencyMs: 0, message: "cache" }],
        };
      }

      const attempt = () =>
        withTimeout(provider.getEstimate(origin, destination), TIMEOUT_MS);

      try {
        let options: MobilityOption[];
        try {
          options = await attempt();
        } catch {
          // retry controlado: 1 tentativa adicional
          options = await attempt();
        }
        failures.delete(provider.id);
        cache.set(cacheKey, { at: Date.now(), options });
        return {
          options,
          statuses: [{ ...status, latencyMs: Date.now() - started }],
        };
      } catch (err) {
        const f = failures.get(provider.id) ?? { count: 0, openedAt: Date.now() };
        failures.set(provider.id, { count: f.count + 1, openedAt: Date.now() });
        console.error(`[mobility-gateway] ${provider.id} falhou`, err);
        return {
          options: [],
          statuses: [
            {
              ...status,
              healthy: false,
              message: "Temporariamente indisponível.",
              latencyMs: Date.now() - started,
            },
          ],
        };
      }
    }),
  );

  return {
    options: results.flatMap((r) => r.options),
    statuses: results.flatMap((r) => r.statuses),
  };
}
