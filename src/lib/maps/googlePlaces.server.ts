import { cached, googleMapsFetch } from "./google.server";
import { GoogleMapsError, type PlaceSuggestion, type SelectedPlace } from "./types";

/** Camada única de acesso à Places API (New). Nenhum componente React chama o Google direto. */
export const GooglePlacesService = {
  async autocomplete(input: {
    query: string;
    sessionToken: string;
    bias?: { latitude: number; longitude: number };
  }): Promise<PlaceSuggestion[]> {
    const query = input.query.trim();
    if (query.length < 3) return [];

    const body: Record<string, unknown> = {
      input: query,
      sessionToken: input.sessionToken,
      languageCode: "pt-BR",
      regionCode: "BR",
      locationBias: {
        circle: {
          center: input.bias ?? { latitude: -23.5505, longitude: -46.6333 },
          radius: 50000,
        },
      },
    };

    const data = (await cached(
      `ac:${query.toLowerCase()}:${input.bias?.latitude ?? ""},${input.bias?.longitude ?? ""}`,
      60_000,
      () =>
        googleMapsFetch("/places/v1/places:autocomplete", {
          method: "POST",
          headers: {
            "X-Goog-FieldMask":
              "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
          },
          body,
        }),
    )) as {
      suggestions?: Array<{
        placePrediction?: { placeId?: string; text?: { text?: string } };
      }>;
    };

    return (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text: { text: string } } =>
        Boolean(p?.placeId && p?.text?.text),
      )
      .map((p) => ({ placeId: p.placeId, description: p.text.text }));
  },

  async details(placeId: string, sessionToken?: string): Promise<SelectedPlace> {
    if (!/^[A-Za-z0-9_-]+$/.test(placeId)) {
      throw new GoogleMapsError("INVALID_INPUT", "Identificador de lugar inválido.");
    }
    const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    const data = (await googleMapsFetch(`/places/v1/places/${placeId}${qs}`, {
      headers: {
        "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
        "Accept-Language": "pt-BR",
      },
    })) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    };

    if (!data.location?.latitude || !data.location?.longitude) {
      throw new GoogleMapsError("NOT_FOUND", "Endereço não encontrado no Google Maps.");
    }

    return {
      placeId: data.id ?? placeId,
      formattedAddress:
        data.formattedAddress ?? data.displayName?.text ?? "Endereço selecionado",
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    };
  },

  /** Geocodificação reversa para o botão "usar minha localização". */
  async reverseGeocode(latitude: number, longitude: number): Promise<SelectedPlace> {
    const data = (await cached(
      `rg:${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      300_000,
      () =>
        googleMapsFetch(
          `/maps/api/geocode/json?latlng=${latitude},${longitude}&language=pt-BR`,
        ),
    )) as {
      status?: string;
      results?: Array<{ place_id?: string; formatted_address?: string }>;
    };

    const first = data.results?.[0];
    if (data.status !== "OK" || !first) {
      return {
        placeId: "",
        formattedAddress: `Minha localização (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        latitude,
        longitude,
      };
    }
    return {
      placeId: first.place_id ?? "",
      formattedAddress: first.formatted_address ?? "Minha localização",
      latitude,
      longitude,
    };
  },
};
