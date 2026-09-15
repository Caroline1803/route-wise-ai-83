/**
 * Tipagem mínima da Maps JavaScript API usada pela aplicação.
 * Evita dependência de tipos globais no build.
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface LatLngLike {
  lat(): number;
  lng(): number;
}

export interface MapsMap {
  fitBounds(bounds: MapsBounds, padding?: number): void;
  setZoom(zoom: number): void;
}

export interface MapsBounds {
  extend(point: LatLngLiteral | LatLngLike): MapsBounds;
  isEmpty(): boolean;
}

export interface MapsOverlay {
  setMap(map: MapsMap | null): void;
}

export interface GoogleMapsApi {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => MapsMap;
  Marker: new (options: Record<string, unknown>) => MapsOverlay;
  Polyline: new (options: Record<string, unknown>) => MapsOverlay;
  LatLngBounds: new () => MapsBounds;
  geometry: {
    encoding: { decodePath(encoded: string): LatLngLike[] };
  };
}
