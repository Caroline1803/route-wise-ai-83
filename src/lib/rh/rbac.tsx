import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { RhRole, RhSession } from "./types";

/**
 * RBAC do Portal RH.
 * O MVP resolve as permissões no cliente para permitir a demonstração;
 * no backend real as mesmas chaves devem ser validadas no servidor.
 */

export type RhPermission =
  | "dashboard"
  | "employees"
  | "credits"
  | "mobility"
  | "policies"
  | "transactions"
  | "cashback"
  | "intelligence"
  | "esg"
  | "reports"
  | "integrations"
  | "settings"
  | "write";

const ROLE_PERMISSIONS: Record<RhRole, RhPermission[]> = {
  RH_ADMIN: [
    "dashboard",
    "employees",
    "credits",
    "mobility",
    "policies",
    "transactions",
    "cashback",
    "intelligence",
    "esg",
    "reports",
    "integrations",
    "settings",
    "write",
  ],
  GESTOR: [
    "dashboard",
    "employees",
    "mobility",
    "transactions",
    "intelligence",
    "esg",
    "reports",
  ],
  FINANCEIRO: ["dashboard", "credits", "transactions", "cashback", "reports", "write"],
  ESG: ["dashboard", "esg", "mobility", "reports"],
  AUDITOR: [
    "dashboard",
    "employees",
    "credits",
    "mobility",
    "policies",
    "transactions",
    "cashback",
    "intelligence",
    "esg",
    "reports",
    "integrations",
  ],
};

export const ROLE_LABEL: Record<RhRole, string> = {
  RH_ADMIN: "RH Administrador",
  GESTOR: "Gestor",
  FINANCEIRO: "Financeiro",
  ESG: "ESG",
  AUDITOR: "Auditor (somente leitura)",
};

export const ROLE_DESCRIPTION: Record<RhRole, string> = {
  RH_ADMIN: "Acesso total ao portal.",
  GESTOR: "Visualiza a própria equipe e departamento.",
  FINANCEIRO: "Créditos, pagamentos, custos e relatórios financeiros.",
  ESG: "Sustentabilidade, CO₂ e relatórios ESG.",
  AUDITOR: "Acesso somente leitura a todas as áreas.",
};

interface RhSessionValue {
  session: RhSession;
  setRole: (role: RhRole) => void;
  can: (permission: RhPermission) => boolean;
}

const RhSessionContext = createContext<RhSessionValue | null>(null);

export function RhSessionProvider({
  children,
  company,
}: {
  children: ReactNode;
  company: string;
}) {
  const [role, setRole] = useState<RhRole>("RH_ADMIN");

  const value = useMemo<RhSessionValue>(
    () => ({
      session: {
        userName: "Caroline Martins",
        role,
        company,
        department: role === "GESTOR" ? "Tecnologia" : undefined,
      },
      setRole,
      can: (permission) => ROLE_PERMISSIONS[role].includes(permission),
    }),
    [role, company],
  );

  return <RhSessionContext.Provider value={value}>{children}</RhSessionContext.Provider>;
}

export function useRhSession(): RhSessionValue {
  const ctx = useContext(RhSessionContext);
  if (!ctx) throw new Error("useRhSession precisa estar dentro de <RhSessionProvider>.");
  return ctx;
}
