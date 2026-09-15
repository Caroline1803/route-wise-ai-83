import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/maps/loader";
import type { GoogleMapsApi, MapsMap, MapsOverlay } from "@/lib/maps/mapsApi";

export interface MapPoint {
  latitude: number;
  longitude: number;
  label: string;
  title?: string;
}

export interface MapPath {
  encodedPolyline: string;
  color: string;
}

/** Mapa interativo base. Não faz chamadas de Places no navegador. */
export function GoogleMap({
  points,
  paths = [],
  className = "h-72 w-full rounded-2xl border border-border",
}: {
  points: MapPoint[];
  paths?: MapPath[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<MapsMap | null>(null);
  const overlaysRef = useRef<MapsOverlay[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        apiRef.current = api;
        mapRef.current = new api.Map(containerRef.current, {
          center: { lat: -23.5505, lng: -46.6333 },
          zoom: 12,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
        setReady(true);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!ready || !api || !map) return;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new api.LatLngBounds();

    points.forEach((p) => {
      const position = { lat: p.latitude, lng: p.longitude };
      overlaysRef.current.push(
        new api.Marker({
          map,
          position,
          label: p.label,
          ...(p.title ? { title: p.title } : {}),
        }),
      );
      bounds.extend(position);
    });

    paths.forEach((path) => {
      const decoded = api.geometry.encoding.decodePath(path.encodedPolyline);
      overlaysRef.current.push(
        new api.Polyline({
          map,
          path: decoded,
          strokeColor: path.color,
          strokeOpacity: 0.9,
          strokeWeight: 5,
        }),
      );
      decoded.forEach((pt) => bounds.extend(pt));
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 48);
      if (points.length === 1 && paths.length === 0) map.setZoom(15);
    }
  }, [ready, points, paths]);

  if (error) {
    return (
      <div
        className={`${className} grid place-items-center bg-secondary p-4 text-center text-sm text-muted-foreground`}
      >
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className={className} aria-label="Mapa do trajeto" />;
}
