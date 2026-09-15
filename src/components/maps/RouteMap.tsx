import { GoogleMap, type MapPath } from "./GoogleMap";
import type { SelectedPlace } from "@/lib/maps/types";

/** Mapa do trajeto: origem, destino e traçados (um por trecho). */
export function RouteMap({
  origin,
  destination,
  paths = [],
}: {
  origin: SelectedPlace | null;
  destination: SelectedPlace | null;
  paths?: MapPath[];
}) {
  const points = [
    origin
      ? {
          latitude: origin.latitude,
          longitude: origin.longitude,
          label: "A",
          title: origin.formattedAddress,
        }
      : null,
    destination
      ? {
          latitude: destination.latitude,
          longitude: destination.longitude,
          label: "B",
          title: destination.formattedAddress,
        }
      : null,
  ].filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="space-y-2">
      <GoogleMap points={points} paths={paths} className="h-80 w-full rounded-2xl border border-border" />
      {paths.length > 1 && (
        <p className="text-xs text-muted-foreground">
          Cores diferentes representam trechos diferentes da viagem.
        </p>
      )}
    </div>
  );
}
