import { GoogleMapsError } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

/** Cache simples em memória para evitar chamadas repetidas ao Google. */
const cache = new Map<string, { at: number; value: unknown }>();

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value as T);
  return load().then((value) => {
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 300) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (oldest) cache.delete(oldest[0]);
    }
    return value;
  });
}

/** Chamada autenticada ao Google Maps Platform via gateway (somente servidor). */
export async function googleMapsFetch(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
): Promise<unknown> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new GoogleMapsError(
      "UNAVAILABLE",
      "Integração com o Google Maps não está configurada neste ambiente.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch (error) {
    throw new GoogleMapsError(
      "UNAVAILABLE",
      `Não foi possível falar com o Google Maps: ${(error as Error).message}`,
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Google Maps gateway falhou [${response.status}]: ${errorBody}`);
    if (response.status === 403) {
      const details: Array<{ reason?: string }> =
        safeJson(errorBody)?.error?.details ?? [];
      const reason = details.find((d) => d.reason)?.reason;
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
        throw new GoogleMapsError(
          "DENIED",
          'A chave de servidor do Google Maps está restrita por referrer. No Google Cloud Console, defina as restrições de aplicativo da chave de SERVIDOR como "Nenhuma" ou "Endereços IP".',
        );
      }
      if (reason === "API_KEY_SERVICE_BLOCKED") {
        throw new GoogleMapsError(
          "DENIED",
          "A chave de servidor do Google Maps não permite esta API. Adicione-a à lista de APIs permitidas no Google Cloud Console.",
        );
      }
      throw new GoogleMapsError("DENIED", "O Google Maps recusou a requisição (403).");
    }
    if (response.status === 429) {
      throw new GoogleMapsError(
        "QUOTA",
        "Limite de uso do Google Maps atingido. Tente novamente em alguns instantes.",
      );
    }
    throw new GoogleMapsError(
      "UNAVAILABLE",
      `Google Maps indisponível no momento (${response.status}).`,
    );
  }

  return response.json();
}

function safeJson(text: string): { error?: { details?: Array<{ reason?: string }> } } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
