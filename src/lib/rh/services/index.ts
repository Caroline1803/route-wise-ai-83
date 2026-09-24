/**
 * Camada de services do Portal RH.
 *
 * React Component -> Service -> API / Mock Provider
 *
 * Hoje os services leem a camada de demonstração (`src/lib/rh/mock/data.ts`).
 * Para plugar o backend real (FastAPI) basta trocar o corpo de cada função
 * por um `fetch`, mantendo os mesmos tipos de retorno.
 */

import {
  MOCK_COMPANY,
  MOCK_PERIOD,
  mockCashback,
  mockCreditAccount,
  mockDashboardData,
  mockEmployees,
  mockEsg,
  mockIntegrations,
  mockIntelligence,
  mockMobilityAnalytics,
  mockPolicies,
  mockSpendHistory12,
  mockTransactions,
} from "../mock/data";
import type {
  CashbackCampaign,
  CashbackData,
  CreditAccount,
  DashboardData,
  Employee,
  EsgData,
  IntegrationStatus,
  IntelligenceData,
  MobilityAnalytics,
  MobilityPolicy,
  SpendPoint,
  Transaction,
} from "../types";

/** Simula a latência de rede para que os estados de carregamento sejam reais. */
const delay = <T,>(data: T, ms = 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const companyContext = { company: MOCK_COMPANY, period: MOCK_PERIOD };

export const rhDashboardService = {
  getDashboard: (): Promise<DashboardData> => delay(mockDashboardData),
  getSpendHistory: (months: 3 | 6 | 12): Promise<SpendPoint[]> =>
    delay(mockSpendHistory12.slice(-months)),
};

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  modal?: string;
  spendRange?: string;
}

export const employeeService = {
  list: async (filters: EmployeeFilters = {}): Promise<Employee[]> => {
    const q = (filters.search ?? "").trim().toLowerCase();
    const result = mockEmployees.filter((e) => {
      if (
        q &&
        ![e.name, e.registration, e.cpfMasked, e.department]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      if (filters.department && filters.department !== "all" && e.department !== filters.department)
        return false;
      if (filters.status && filters.status !== "all" && e.status !== filters.status) return false;
      if (filters.modal && filters.modal !== "all" && !e.mainModal.includes(filters.modal))
        return false;
      if (filters.spendRange && filters.spendRange !== "all") {
        const [min, max] = filters.spendRange.split("-").map(Number);
        if (e.used < (min ?? 0) || e.used > (max ?? Infinity)) return false;
      }
      return true;
    });
    return delay(result, 160);
  },
  get: (id: string): Promise<Employee | undefined> =>
    delay(mockEmployees.find((e) => e.id === id), 160),
  departments: (): string[] => [...new Set(mockEmployees.map((e) => e.department))].sort(),
  /** MVP: a alteração é apenas local/simulada, sem persistência. */
  updateLimit: (id: string, limit: number): Promise<{ ok: true; id: string; limit: number }> =>
    delay({ ok: true as const, id, limit }),
  toggleBlock: (id: string): Promise<{ ok: true; id: string }> => delay({ ok: true as const, id }),

  /** Verificação prévia de duplicidade de CPF/e-mail (MOCK). */
  checkDuplicate: async (input: { email?: string; cpf?: string }) => {
    const email = (input.email ?? "").trim().toLowerCase();
    const cpf = (input.cpf ?? "").replace(/\D/g, "");
    return delay(
      {
        emailTaken: email.length > 0 && identityRegistry.some((r) => r.email === email),
        cpfTaken: cpf.length === 11 && identityRegistry.some((r) => r.cpf === cpf),
      },
      120,
    );
  },

  /**
   * Cadastro de colaborador pelo Portal RH.
   * MVP: grava apenas na camada de demonstração em memória (carteira digital
   * inicial + registro de auditoria simulados). Trocar por POST /company/employees.
   */
  create: async (input: NewEmployeeInput): Promise<Employee> => {
    const email = input.email.trim().toLowerCase();
    const cpf = input.cpf.replace(/\D/g, "");
    if (identityRegistry.some((r) => r.email === email)) {
      throw new Error("Já existe um colaborador com este e-mail corporativo.");
    }
    if (identityRegistry.some((r) => r.cpf === cpf)) {
      throw new Error("Já existe um colaborador com este CPF.");
    }

    const employee: Employee = {
      id: `n${Date.now().toString().slice(-6)}`,
      name: input.name.trim(),
      registration: input.registration.trim(),
      cpfMasked: `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`,
      department: input.department,
      role: input.position.trim(),
      status: input.status,
      policyId: input.policyId,
      monthlyLimit: input.monthlyLimit,
      used: 0,
      balance: input.monthlyLimit,
      mainModal: input.allowedModals[0] ?? "Transporte público",
      allowedModals: input.allowedModals,
      avgMonthlySpend: 0,
      cashbackAccrued: 0,
      co2AvoidedKg: 0,
    };

    identityRegistry.push({ email, cpf });
    mockEmployees.unshift(employee);
    return delay(employee, 320);
  },
};

export const creditService = {
  getAccount: (): Promise<CreditAccount> => delay(mockCreditAccount),
  /** Compra SIMULADA — nenhum pagamento financeiro real é processado no MVP. */
  purchase: (amount: number, method: string) =>
    delay({
      ok: true as const,
      simulated: true as const,
      amount,
      method,
      protocol: `SIM-${Date.now().toString().slice(-6)}`,
    }),
  distribute: (mode: "EQUAL" | "POLICY", amountPerEmployee?: number) =>
    delay({ ok: true as const, simulated: true as const, mode, amountPerEmployee }),
};

export const policyService = {
  list: (): Promise<MobilityPolicy[]> => delay(mockPolicies),
  create: (policy: Omit<MobilityPolicy, "id">) =>
    delay({ ...policy, id: `p${Date.now()}` } as MobilityPolicy),
  duplicate: (id: string) => delay({ ok: true as const, id }),
  toggleActive: (id: string) => delay({ ok: true as const, id }),
};

export interface TransactionFilters {
  employee?: string;
  modal?: string;
  status?: string;
  minAmount?: number;
  from?: string;
  to?: string;
}

export const transactionService = {
  list: async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
    const result = mockTransactions.filter((t) => {
      if (filters.employee && filters.employee !== "all" && t.employeeName !== filters.employee)
        return false;
      if (filters.modal && filters.modal !== "all" && t.modal !== filters.modal) return false;
      if (filters.status && filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.minAmount && t.amount < filters.minAmount) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      return true;
    });
    return delay(result, 160);
  },
  toCsv: (rows: Transaction[]): string => {
    const header = [
      "Data",
      "Colaborador",
      "Modal",
      "Origem",
      "Destino",
      "Valor",
      "Cashback",
      "Fonte",
      "Status",
    ];
    const body = rows.map((t) =>
      [
        new Date(t.date).toLocaleString("pt-BR"),
        t.employeeName,
        t.modal,
        t.origin,
        t.destination,
        t.amount.toFixed(2),
        t.cashback.toFixed(2),
        t.source,
        t.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    return [header.join(";"), ...body].join("\n");
  },
};

export const analyticsService = {
  getMobility: (): Promise<MobilityAnalytics> => delay(mockMobilityAnalytics),
  getIntelligence: (): Promise<IntelligenceData> => delay(mockIntelligence),
  getIntegrations: (): Promise<IntegrationStatus[]> => delay(mockIntegrations),
};

export const esgService = {
  get: (): Promise<EsgData> => delay(mockEsg),
};

export const cashbackService = {
  get: (): Promise<CashbackData> => delay(mockCashback),
  createCampaign: (campaign: Omit<CashbackCampaign, "id" | "used">) =>
    delay({ ...campaign, id: `cp${Date.now()}`, used: 0 } as CashbackCampaign),
};
