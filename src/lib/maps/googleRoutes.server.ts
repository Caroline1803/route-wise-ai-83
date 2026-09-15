import { cached, googleMapsFetch } from "./google.server";
import {
  GoogleMapsError,
  type RouteResult,
  type SelectedPlace,
  type TransitStep,
  type TravelMode,
} from "./types";

interface RawLeg {
  steps?: Array<{
    travelMode?: string;
    distanceMeters?: number;
    staticDuration?: string;
    navigationInstruction?: { instructions?: string };
    transitDetails?: {
      stopDetails?: {
        departureStop?: { name?: string };
        arrivalStop?: { name?: string };
      };
      localizedValues?: { departureTime?: { time?: { text?: string } } };
      transitLine?: {
        name?: string;
        nameShort?: string;
        vehicle?: { type?: string; name?: { text?: string } };
      };
      stopCount?: number;
    };
  }>;
}

const seconds = (value?: string) => (value ? Number(value.replace("s", "")) || 0 : 0);

/** Camada única de acesso à Routes API (computeRoutes). */
export const GoogleRoutesService = {
  async computeRoute(
    origin: SelectedPlace,
    destination: SelectedPlace,
    travelMode: TravelMode = "DRIVE",
  ): Promise<RouteResult> {
    const key = `route:${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}:${travelMode}`;

    const data = (await cached(key, travelMode === "TRANSIT" ? 60_000 : 300_000, () =>
      googleMapsFetch("/routes/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.transitDetails",
        },
        body: {
          origin: {
            location: {
              latLng: { latitude: origin.latitude, longitude: origin.longitude },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,
                longitude: destination.longitude,
              },
            },
          },
          travelMode,
          ...(travelMode === "DRIVE" ? { routingPreference: "TRAFFIC_AWARE" } : {}),
          languageCode: "pt-BR",
          units: "METRIC",
        },
      }),
    )) as {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
        legs?: RawLeg[];
      }>;
    };

    const route = data.routes?.[0];
    if (!route || typeof route.distanceMeters !== "number") {
      throw new GoogleMapsError(
        "ROUTE_NOT_FOUND",
        "Não encontramos uma rota para esse destino. Verifique os endereços e tente novamente.",
      );
    }

    const durationSeconds = seconds(route.duration);
    const steps = extractSteps(route.legs ?? []);

    return {
      origin,
      destination,
      distanceMeters: route.distanceMeters,
      distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
      durationSeconds,
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      ...(route.polyline?.encodedPolyline
        ? { encodedPolyline: route.polyline.encodedPolyline }
        : {}),
      travelMode,
      ...(steps.length > 0
        ? {
            steps,
            transfers: Math.max(0, steps.filter((s) => s.mode === "TRANSIT").length - 1),
          }
        : {}),
      dataSource: "GOOGLE_MAPS" as const,
    };
  },
};

function extractSteps(legs: RawLeg[]): TransitStep[] {
  const steps: TransitStep[] = [];
  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const durationMinutes = Math.max(1, Math.round(seconds(step.staticDuration) / 60));
      const distanceKm = Math.round(((step.distanceMeters ?? 0) / 1000) * 10) / 10;
      const transit = step.transitDetails;
      if (transit?.transitLine) {
        const line = transit.transitLine.nameShort ?? transit.transitLine.name ?? "Linha";
        steps.push({
          mode: "TRANSIT",
          description: `${transit.transitLine.vehicle?.name?.text ?? "Transporte"} ${line}`,
          durationMinutes,
          distanceKm,
          line,
          ...(transit.transitLine.vehicle?.type
            ? { vehicle: transit.transitLine.vehicle.type }
            : {}),
          ...(transit.stopDetails?.departureStop?.name
            ? { departureStop: transit.stopDetails.departureStop.name }
            : {}),
          ...(transit.stopDetails?.arrivalStop?.name
            ? { arrivalStop: transit.stopDetails.arrivalStop.name }
            : {}),
          ...(transit.localizedValues?.departureTime?.time?.text
            ? { departureTime: transit.localizedValues.departureTime.time.text }
            : {}),
        });
      } else if (step.travelMode === "WALK") {
        steps.push({
          mode: "WALK",
          description: step.navigationInstruction?.instructions ?? "Caminhada",
          durationMinutes,
          distanceKm,
        });
      }
    }
  }
  // Só faz sentido detalhar quando há transporte público envolvido.
  return steps.some((s) => s.mode === "TRANSIT") ? steps : [];
}
