/** Modelo canônico de geolocalização/roteamento vindo do Google Maps Platform. */

export interface SelectedPlace {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export type TravelMode = "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT";

export interface TransitStep {
  mode: "WALK" | "TRANSIT";
  description: string;
  durationMinutes: number;
  distanceKm: number;
  line?: string;
  vehicle?: string;
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
}

export interface RouteResult {
  origin: SelectedPlace;
  destination: SelectedPlace;

  distanceMeters: number;
  distanceKm: number;

  durationSeconds: number;
  durationMinutes: number;

  encodedPolyline?: string;

  travelMode: TravelMode;

  /** Trechos detalhados (apenas quando a API retorna, ex.: TRANSIT) */
  steps?: TransitStep[];
  transfers?: number;

  dataSource: "GOOGLE_MAPS";
}

export class GoogleMapsError extends Error {
  code:
    | "NOT_FOUND"
    | "ROUTE_NOT_FOUND"
    | "QUOTA"
    | "DENIED"
    | "UNAVAILABLE"
    | "INVALID_INPUT";

  constructor(code: GoogleMapsError["code"], message: string) {
    super(message);
    this.name = "GoogleMapsError";
    this.code = code;
  }
}
