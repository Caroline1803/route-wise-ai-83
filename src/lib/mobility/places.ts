import type { Location } from "./types";

/** Locais de referência usados no seletor de origem/destino do MVP. */
export const PLACES: (Location & { label: string })[] = [
  { label: "Av. Paulista, 1000", latitude: -23.5613, longitude: -46.6565 },
  { label: "Praça da Sé", latitude: -23.5505, longitude: -46.6333 },
  { label: "Vila Olímpia", latitude: -23.5955, longitude: -46.6881 },
  { label: "Ibirapuera", latitude: -23.5874, longitude: -46.6576 },
  { label: "Pinheiros", latitude: -23.5671, longitude: -46.7021 },
  { label: "Aeroporto de Congonhas", latitude: -23.6266, longitude: -46.6554 },
  { label: "Barra Funda", latitude: -23.5257, longitude: -46.6663 },
  { label: "Santo Amaro", latitude: -23.6543, longitude: -46.7092 },
];
