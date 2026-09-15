import type { GoogleMapsApi } from "./mapsApi";

/**
 * Carrega a Maps JavaScript API no navegador.
 * A chave do navegador é pública e restrita por referrer; nenhuma chave de
 * servidor é exposta aqui. Places NÃO é carregado no navegador — buscas de
 * lugares passam pelo backend.
 */
let promise: Promise<GoogleMapsApi> | null = null;

export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Mapa disponível apenas no navegador."));
  }
  if (promise) return promise;

  const env = import.meta.env as Record<string, string | undefined>;
  const key = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];

  if (!key) {
    return Promise.reject(new Error("Mapa indisponível: chave do navegador ausente."));
  }

  promise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const win = window as unknown as Record<string, unknown>;
    const callbackName = "__maasInitGoogleMaps";
    win[callbackName] = () => {
      const api = (win["google"] as { maps?: GoogleMapsApi } | undefined)?.maps;
      if (api) resolve(api);
      else reject(new Error("Não foi possível carregar o mapa."));
    };
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&loading=async&libraries=geometry&language=pt-BR&region=BR&callback=${callbackName}` +
      (channel ? `&channel=${encodeURIComponent(channel)}` : "");
    script.async = true;
    script.onerror = () => reject(new Error("Não foi possível carregar o mapa."));
    document.head.appendChild(script);
  });

  return promise;
}
