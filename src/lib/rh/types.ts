/**
 * Tipos do Portal RH (gestão de mobilidade corporativa).
 * Estes tipos descrevem o contrato que o backend real (FastAPI) deverá
 * cumprir — os componentes React nunca importam mocks diretamente.
 */

export type RhRole = "RH_ADMIN" | "GESTOR" | "FINANCEIRO" | "ESG" | "AUDITOR";

export type DataSource = "LIVE" | "SANDBOX" | "MOCK";

export interface RhSession {
  userName: string;
  role: RhRole;
  company: string;
  department?: string;
}

export interface KpiDelta {
  value: number;
  label: string;
  direction: "up" | "down" | "flat";
  positive: boolean;
}

export interface DashboardKpis {
  activeEmployees: number;
  activeEmployeesDelta: KpiDelta;
  creditsIssued: number;
  creditsUsed: number;
  usageRate: number;
  availableBalance: number;
  savings: number;
  cashback: number;
}

export interface SpendPoint {
  month: string;
  total: number;
}

export interface ModalShare {
  modal: string;
  icon: string;
  share: number;
  cost: number;
}

export type AlertKind = "BUDGET" | "SAVING" | "SUSTAINABILITY" | "ANOMALY";

export interface RhAlert {
  id: string;
  kind: AlertKind;
  title: string;
  message: string;
  severity: "info" | "attention";
}

export interface DashboardData {
  kpis: DashboardKpis;
  spendHistory: SpendPoint[];
  modalShare: ModalShare[];
  alerts: RhAlert[];
}

export type EmployeeStatus = "ATIVO" | "BLOQUEADO" | "INATIVO";

export interface Employee {
  id: string;
  name: string;
  registration: string;
  cpfMasked: string;
  department: string;
  role: string;
  status: EmployeeStatus;
  policyId: string;
  monthlyLimit: number;
  used: number;
  balance: number;
  mainModal: string;
  allowedModals: string[];
  avgMonthlySpend: number;
  cashbackAccrued: number;
  co2AvoidedKg: number;
}

export interface Transaction {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  modal: string;
  origin: string;
  destination: string;
  amount: number;
  cashback: number;
  source: DataSource;
  status: "CONFIRMADA" | "PENDENTE" | "ESTORNADA";
}

export interface MobilityPolicyRule {
  modal: string;
  allowed: boolean;
  window?: string;
  monthlyCap?: number;
  cashbackRate?: number;
  note?: string;
}

export interface MobilityPolicy {
  id: string;
  name: string;
  active: boolean;
  monthlyLimit: number;
  employees: number;
  rules: MobilityPolicyRule[];
}

export interface CreditAccount {
  corporateBalance: number;
  employees: number;
  averageCredit: number;
  nextDistribution: string;
  byDepartment: { department: string; amount: number; employees: number }[];
  purchases: {
    id: string;
    date: string;
    amount: number;
    method: string;
    status: "SIMULADA";
  }[];
}

export interface MobilityAnalytics {
  tripsThisMonth: number;
  averageCost: number;
  averageMinutes: number;
  averageKm: number;
  topModals: { modal: string; trips: number }[];
  peakHours: { hour: string; trips: number }[];
  topOrigins: { area: string; trips: number }[];
  topDestinations: { area: string; trips: number }[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impactLabel: string;
  impactValue: number;
}

export interface Forecast {
  nextMonth: number;
  low: number;
  high: number;
  currentMonth: number;
  variation: number;
}

export interface IntelligenceData {
  potentialSaving: number;
  summary: string;
  insights: Insight[];
  forecast: Forecast;
}

export interface EsgData {
  co2AvoidedTons: number;
  sustainableTrips: number;
  sustainableShare: number;
  evolution: number;
  comparison: { modal: string; gramsPerKm: number }[];
  history: { month: string; share: number }[];
}

export interface CashbackCampaign {
  id: string;
  name: string;
  active: boolean;
  period: string;
  audience: string;
  rates: { modal: string; rate: number }[];
  budget: number;
  used: number;
}

export interface CashbackData {
  distributed: number;
  participants: number;
  activeCampaigns: number;
  campaigns: CashbackCampaign[];
}

export interface IntegrationStatus {
  id: string;
  name: string;
  purpose: string;
  source: DataSource;
  detail: string;
}
