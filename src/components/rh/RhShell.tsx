import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Bike,
  CalendarDays,
  ChartColumn,
  CreditCard,
  FileText,
  Leaf,
  LayoutDashboard,
  Menu,
  Plug,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { RhAiAssistant } from "@/components/rh/RhAiAssistant";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ROLE_DESCRIPTION, ROLE_LABEL, useRhSession, type RhPermission } from "@/lib/rh/rbac";
import { mockDashboardData } from "@/lib/rh/mock/data";
import { cn } from "@/lib/utils";
import type { RhRole } from "@/lib/rh/types";

const NAV: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: RhPermission;
}[] = [
  { to: "/rh", label: "Visão Geral", icon: LayoutDashboard, permission: "dashboard" },
  { to: "/rh/colaboradores", label: "Colaboradores", icon: Users, permission: "employees" },
  { to: "/rh/creditos", label: "Créditos e Carteira", icon: Wallet, permission: "credits" },
  { to: "/rh/mobilidade", label: "Mobilidade", icon: Bike, permission: "mobility" },
  { to: "/rh/politicas", label: "Políticas", icon: Shield, permission: "policies" },
  { to: "/rh/transacoes", label: "Transações", icon: Receipt, permission: "transactions" },
  { to: "/rh/cashback", label: "Cashback", icon: CreditCard, permission: "cashback" },
  { to: "/rh/intelligence", label: "MaaS Intelligence", icon: Sparkles, permission: "intelligence" },
  { to: "/rh/esg", label: "ESG e Sustentabilidade", icon: Leaf, permission: "esg" },
  { to: "/rh/relatorios", label: "Relatórios", icon: FileText, permission: "reports" },
  { to: "/rh/integracoes", label: "Integrações", icon: Plug, permission: "integrations" },
  { to: "/rh/configuracoes", label: "Configurações", icon: Settings, permission: "settings" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useRhSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-1">
      {NAV.filter((item) => can(item.permission)).map(({ to, label, icon: Icon }) => {
        const active = to === "/rh" ? pathname === "/rh" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/rh" className="flex items-center gap-2 px-1 py-1">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-lg">🧭</span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-foreground">MaaS Corporate AI</span>
        <span className="block text-[11px] text-muted-foreground">Portal RH</span>
      </span>
    </Link>
  );
}

export function RhShell({ children }: { children: ReactNode }) {
  const { session, setRole } = useRhSession();
  const [aiOpen, setAiOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const alerts = mockDashboardData.alerts;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList />
        </div>
        <Link
          to="/planejar"
          className="mt-4 rounded-xl border border-border p-3 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          Ir para o app do colaborador →
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet open={mobileNav} onOpenChange={setMobileNav}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetTitle className="sr-only">Menu do Portal RH</SheetTitle>
                <Brand />
                <div className="mt-6">
                  <NavList onNavigate={() => setMobileNav(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-foreground">
                {session.company}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Setembro de 2026
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles className="mr-1.5 h-4 w-4 text-primary" /> Pergunte à MaaS AI
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Pergunte à MaaS AI"
                onClick={() => setAiOpen(true)}
              >
                <Sparkles className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Alertas do período</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {alerts.map((a) => (
                    <DropdownMenuItem key={a.id} className="flex-col items-start gap-1 whitespace-normal">
                      <span className="text-xs font-semibold text-foreground">{a.title}</span>
                      <span className="text-xs text-muted-foreground">{a.message}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      CM
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block text-xs font-semibold text-foreground">
                        {session.userName}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {ROLE_LABEL[session.role]}
                      </span>
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Perfil de acesso (RBAC)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(ROLE_LABEL) as RhRole[]).map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onSelect={() => setRole(role)}
                      className="flex-col items-start gap-0.5 whitespace-normal"
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          session.role === role ? "text-primary" : "text-foreground",
                        )}
                      >
                        {ROLE_LABEL[role]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {ROLE_DESCRIPTION[role]}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>

      <RhAiAssistant open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

export function NoAccess({ area }: { area: string }) {
  const { session } = useRhSession();
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 font-display text-lg font-semibold text-foreground">Acesso restrito</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        O perfil <strong>{ROLE_LABEL[session.role]}</strong> não tem permissão para acessar {area}.
        Troque de perfil no menu do usuário para visualizar esta área.
      </p>
    </div>
  );
}

export const RH_CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export { ChartColumn };
