import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Clock, Gift, History, Hourglass, PiggyBank, Route as RouteIcon, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeShell } from "@/components/employee/EmployeeShell";
import { RhKpiCard } from "@/components/rh/RhKpiCard";
import { getEmployeeDashboard } from "@/lib/employee/employee.functions";
import { brl } from "@/lib/rh/format";

export const Route = createFileRoute("/_authenticated/employee/dashboard")({
  head: () => ({
    meta: [
      { title: "Minha mobilidade — MaaS Corporate AI" },
      { name: "description", content: "Saldo, crédito corporativo, cashback e gastos de mobilidade do colaborador." },
      { property: "og:title", content: "Minha mobilidade — MaaS Corporate AI" },
      { property: "og:description", content: "Seu saldo e seus gastos de mobilidade em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const QUESTIONS = [
  "Quanto tenho disponível?",
  "Quanto já gastei?",
  "Quanto ainda vou gastar?",
  "Qual modal cabe melhor no meu benefício?",
  "Quanto posso economizar?",
  "Meu crédito corporativo será suficiente até o final do mês?",
];

function Dashboard() {
  const fetchDash = useServerFn(getEmployeeDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["employee-dashboard"], queryFn: () => fetchDash() });

  if (isLoading || !data) return <EmployeeShell><p className="text-muted-foreground">Carregando...</p></EmployeeShell>;

  const firstName = data.employee?.name.split(" ")[0] ?? "colaborador";

  if (data.employee?.status === "PENDING") {
    return (
      <EmployeeShell>
        <div className="mx-auto max-w-lg rounded-lg border border-warning/40 bg-warning/10 p-8 text-center">
          <Hourglass className="mx-auto h-10 w-10 text-warning" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Olá, {firstName}! Cadastro em análise</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua carteira já foi criada. Assim que sua empresa aprovar o acesso, seu saldo ficará disponível aqui.
          </p>
        </div>
      </EmployeeShell>
    );
  }

  const w = data.wallet;
  return (
    <EmployeeShell>
      <h1 className="font-display text-3xl font-bold text-foreground">Olá, {firstName} 👋</h1>
      <p className="mt-1 text-muted-foreground">Veja sua mobilidade e seus gastos.</p>

      <section id="carteira" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RhKpiCard label="Seu saldo" value={brl(w.balance)} icon={<Wallet className="h-4 w-4" />} />
        <RhKpiCard label="Crédito corporativo" value={brl(w.credit)} hint="Benefício mensal" icon={<PiggyBank className="h-4 w-4" />} />
        <RhKpiCard label="Cashback" value={brl(w.cashback)} accent="eco" icon={<Gift className="h-4 w-4" />} />
        <RhKpiCard label="Gasto neste mês" value={brl(w.spent)} icon={<TrendingDown className="h-4 w-4" />} />
        <RhKpiCard label="Estimativa até o final do mês" value={brl(data.estimateToEnd)} accent="warning" icon={<Clock className="h-4 w-4" />} />
        <RhKpiCard
          label="Saldo previsto"
          value={brl(data.projectedBalance)}
          accent={data.projectedBalance >= 0 ? "eco" : "warning"}
          hint={data.projectedBalance >= 0 ? "Seu crédito deve durar até o fim do mês" : "Pode faltar crédito"}
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/planejar"><RouteIcon className="h-4 w-4" /> Planejar viagem</Link></Button>
        <Button asChild size="lg" variant="secondary"><Link to="/employee/spending-estimate"><Calculator className="h-4 w-4" /> Estimar gastos</Link></Button>
        <Button asChild size="lg" variant="outline"><a href="#carteira"><Wallet className="h-4 w-4" /> Minha carteira</a></Button>
        <Button asChild size="lg" variant="outline"><Link to="/employee/spending-estimate/history"><History className="h-4 w-4" /> Histórico</Link></Button>
      </div>

      <section className="mt-10 rounded-lg border border-primary/30 bg-card/80 p-6 shadow-soft">
        <h2 className="font-display text-xl font-bold text-foreground">Seu benefício como planejamento financeiro</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O MaaS não só leva você ao trabalho — ele responde as perguntas que importam para o seu bolso.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUESTIONS.map((q) => (
            <li key={q} className="rounded-md border border-border bg-secondary/40 p-4 text-sm font-medium text-foreground">{q}</li>
          ))}
        </ul>
      </section>
    </EmployeeShell>
  );
}
