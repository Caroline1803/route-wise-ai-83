import { createServerFn } from "@tanstack/react-start";
import type { PlaceSuggestion, RouteResult, SelectedPlace, TravelMode } from "./types";

const TRAVEL_MODES: TravelMode[] = ["DRIVE", "WALK", "BICYCLE", "TRANSIT"];

export const autocompletePlaces = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      query: string;
      sessionToken: string;
      bias?: { latitude: number; longitude: number };
    }) => {
      if (typeof input?.query !== "string" || input.query.length > 200) {
        throw new Error("Consulta de endereço inválida.");
      }
      if (typeof input?.sessionToken !== "string" || input.sessionToken.length > 64) {
        throw new Error("Sessão de busca inválida.");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<PlaceSuggestion[]> => {
    const { GooglePlacesService } = await import("./googlePlaces.server");
    return GooglePlacesService.autocomplete(data);
  });

export const getPlaceDetails = createServerFn({ method: "POST" })
  .inputValidator((input: { placeId: string; sessionToken?: string }) => {
    if (typeof input?.placeId !== "string" || !/^[A-Za-z0-9_-]{1,255}$/.test(input.placeId)) {
      throw new Error("Endereço inválido.");
    }
    return input;
  })
  .handler(async ({ data }): Promise<SelectedPlace> => {
    const { GooglePlacesService } = await import("./googlePlaces.server");
    return GooglePlacesService.details(data.placeId, data.sessionToken);
  });

export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((input: { latitude: number; longitude: number }) => {
    const ok =
      typeof input?.latitude === "number" &&
      typeof input?.longitude === "number" &&
      Math.abs(input.latitude) <= 90 &&
      Math.abs(input.longitude) <= 180;
    if (!ok) throw new Error("Coordenadas inválidas.");
    return input;
  })
  .handler(async ({ data }): Promise<SelectedPlace> => {
    const { GooglePlacesService } = await import("./googlePlaces.server");
    return GooglePlacesService.reverseGeocode(data.latitude, data.longitude);
  });

export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      origin: SelectedPlace;
      destination: SelectedPlace;
      travelMode?: TravelMode;
    }) => {
      const isPlace = (p: unknown): p is SelectedPlace =>
        typeof p === "object" &&
        p !== null &&
        typeof (p as SelectedPlace).latitude === "number" &&
        typeof (p as SelectedPlace).longitude === "number";
      if (!isPlace(input?.origin) || !isPlace(input?.destination)) {
        throw new Error("Informe origem e destino válidos.");
      }
      if (input.travelMode && !TRAVEL_MODES.includes(input.travelMode)) {
        throw new Error("Modo de viagem não suportado.");
      }
      return input;
    },
  )
  .handler(async ({ data }): Promise<RouteResult> => {
    const { GoogleRoutesService } = await import("./googleRoutes.server");
    return GoogleRoutesService.computeRoute(
      data.origin,
      data.destination,
      data.travelMode ?? "DRIVE",
    );
  });
