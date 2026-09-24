import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { listCompanies, registerEmployee } from "@/lib/employee/employee.functions";
import { registerSchema } from "@/lib/employee/validation";

export const Route = createFileRoute("/employee/register")({
  head: () => ({
    meta: [
      { title: "Cadastro de colaborador — MaaS Corporate AI" },
      { name: "description", content: "Crie sua conta de colaborador e receba sua carteira digital de mobilidade corporativa." },
      { property: "og:title", content: "Cadastro de colaborador — MaaS Corporate AI" },
      { property: "og:description", content: "Crie sua conta e acesse sua carteira de mobilidade corporativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

type Field = { name: string; label: string; type?: string; placeholder?: string; col?: string };

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: "Dados pessoais",
    fields: [
      { name: "name", label: "Nome completo", col: "sm:col-span-2" },
      { name: "email", label: "E-mail corporativo", type: "email", placeholder: "voce@empresa.com.br" },
      { name: "cpf", label: "CPF", placeholder: "000.000.000-00" },
      { name: "phone", label: "Telefone", placeholder: "(11) 99999-9999" },
      { name: "birth_date", label: "Data de nascimento", type: "date" },
    ],
  },
  {
    title: "Vínculo com a empresa",
    fields: [
      { name: "department", label: "Departamento" },
      { name: "position", label: "Cargo" },
      { name: "cost_center", label: "Centro de custo" },
      { name: "employee_number", label: "Matrícula" },
      { name: "admission_date", label: "Data de admissão", type: "date" },
    ],
  },
  {
    title: "Endereço residencial",
    fields: [
      { name: "address", label: "Endereço residencial", col: "sm:col-span-2" },
      { name: "zip_code", label: "CEP", placeholder: "00000-000" },
      { name: "city", label: "Cidade" },
      { name: "state", label: "Estado (UF)", placeholder: "SP" },
    ],
  },
  {
    title: "Acesso",
    fields: [
      { name: "password", label: "Senha", type: "password" },
      { name: "confirm", label: "Confirmar senha", type: "password" },
    ],
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const fetchCompanies = useServerFn(listCompanies);
  const register = useServerFn(registerEmployee);
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: () => fetchCompanies() });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const errs: Record<string, string> = {};
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
    if (values.password !== values.confirm) errs.confirm = "As senhas não conferem";
    if (!values.terms) errs.terms = "É necessário aceitar os termos";
    setErrors(errs);
    if (Object.keys(errs).length) return toast.error("Revise os campos destacados.");
    setBusy(true);
    try {
      const { confirm: _c, terms: _t, ...payload } = values;
      const res = await register({ data: payload });
      if (!res.ok) {
        if (res.field) setErrors({ [res.field]: res.error });
        toast.error(res.error);
        return;
      }
      toast.success(
        res.status === "ACTIVE"
          ? "Conta criada! Confirme seu e-mail e faça login."
          : "Cadastro enviado! Confirme seu e-mail; sua empresa precisa aprovar o acesso.",
      );
      navigate({ to: "/employee/login" });
    } catch {
      toast.error("Não foi possível concluir o cadastro.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Cadastro de colaborador</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ao concluir, criamos sua carteira digital de mobilidade e aplicamos a política da sua empresa.
        </p>
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
          {SECTIONS.map((s) => (
            <fieldset key={s.title} className="rounded-lg border border-border bg-card/80 p-5 shadow-soft">
              <legend className="px-1 text-sm font-semibold text-foreground">{s.title}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {s.title === "Vínculo com a empresa" ? (
                  <div className="sm:col-span-2">
                    <Label htmlFor="company_id">Empresa</Label>
                    <select
                      id="company_id"
                      name="company_id"
                      defaultValue=""
                      className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    >
                      <option value="" disabled>Selecione sua empresa</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.company_id ? <p className="mt-1 text-xs text-destructive">{errors.company_id}</p> : null}
                  </div>
                ) : null}
                {s.fields.map((f) => (
                  <div key={f.name} className={f.col}>
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <Input id={f.name} name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} className="mt-1.5" aria-invalid={!!errors[f.name]} />
                    {errors[f.name] ? <p className="mt-1 text-xs text-destructive">{errors[f.name]}</p> : null}
                  </div>
                ))}
              </div>
              {s.title === "Acesso" ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Senha forte: 8+ caracteres, com maiúscula, minúscula, número e símbolo.
                </p>
              ) : null}
            </fieldset>
          ))}
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" name="terms" value="1" className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            Aceito os termos de uso e política de privacidade.
          </label>
          {errors.terms ? <p className="-mt-4 text-xs text-destructive">{errors.terms}</p> : null}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button>
            <Link to="/employee/login" className="text-sm text-primary hover:underline">Já tenho conta</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
