import type { Location } from "./types";

export function haversineKm(a: Location, b: Location): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Fator determinístico 0..1 derivado das coordenadas (sem aleatoriedade real). */
export function seed(origin: Location, destination: Location, salt: number): number {
  const raw =
    Math.abs(origin.latitude * 1000 + origin.longitude * 997) +
    Math.abs(destination.latitude * 733 + destination.longitude * 613) +
    salt * 31;
  return (Math.floor(raw * 100) % 1000) / 1000;
}

export const round2 = (v: number) => Math.round(v * 100) / 100;
