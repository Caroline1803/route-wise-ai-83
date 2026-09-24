/**
 * Modelo canônico de mobilidade. Todo provider é normalizado para estes tipos.
 * Nenhum dado aqui é enviado ao provedor sem passar pelo Gateway (backend).
 */

export interface Location {
  latitude: number;
  longitude: number;
  label?: string;
}

export type ProviderId = "UBER" | "99" | "BIKE" | "SCOOTER" | "PUBLIC_TRANSPORT";

export type Modal =
  | "RIDE_HAILING"
  | "BUS"
  | "METRO"
  | "TRAIN"
  | "BIKE"
  | "SCOOTER"
  | "MULTIMODAL";

export type DataSource = "LIVE" | "SANDBOX" | "MOCK";

export interface MobilitySegment {
  modal: Modal;
  provider: ProviderId;
  description: string;
  duration: number;
  price: number;
  distanceKm?: number;
}

export interface MobilityOption {
  id: string;
  provider: ProviderId;
  modal: Modal;
  productName: string;
  estimatedPrice: number;
  currency: "BRL";
  estimatedTimeMinutes: number;
  etaMinutes?: number;
  distanceKm?: number;
  transfers?: number;
  cashback?: number;
  co2Kg?: number;
  available: boolean;
  corporateEligible: boolean;
  corporateRestrictionReason?: string;
  dataSource: DataSource;
  segments?: MobilitySegment[];
  /** 0-100, preenchido pelo Recommendation Engine */
  mobilityScore?: number;
  /** Economia estimada vs. carro individual */
  savingsVsCar?: number;
}

export interface Availability {
  available: boolean;
  details?: string;
  nearestStationMeters?: number;
  vehiclesAvailable?: number;
  docksAvailable?: number;
  dataSource: DataSource;
}

export interface ProviderStatus {
  provider: ProviderId;
  healthy: boolean;
  dataSource: DataSource;
  message?: string;
  latencyMs?: number;
}

/** Adapter Pattern: contrato único para qualquer fornecedor de mobilidade. */
export interface MobilityProvider {
  readonly id: ProviderId;
  getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]>;
  getAvailability(location: Location): Promise<Availability>;
  getStatus(): Promise<ProviderStatus>;
}

export interface CorporatePolicy {
  allowedModals: Modal[];
  rideHailingAllowedAfterHour: number | null;
  monthlyLimit: number;
  monthlyUsed: number;
  maxPerTripRideHailing: number;
}

export interface Wallet {
  balance: number;
  currency: "BRL";
  policy: CorporatePolicy;
}

export interface SearchRequest {
  origin: Location;
  destination: Location;
  /** hora local 0-23, usada para regras de política */
  hourOfDay?: number;
}

export interface SearchResponse {
  requestId: string;
  generatedAt: string;
  wallet: Wallet;
  recommended: MobilityOption | null;
  explanation: string;
  options: MobilityOption[];
  providers: ProviderStatus[];
}
