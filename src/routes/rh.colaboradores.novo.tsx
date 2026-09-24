import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { DemoDataNotice } from "@/components/rh/DemoDataNotice";
import { RhPageHeader, RhSection } from "@/components/rh/RhSection";
import { NoAccess } from "@/components/rh/RhShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { isValidCpf } from "@/lib/employee/validation";
import { useRhSession } from "@/lib/rh/rbac";
import { companyContext, employeeService, policyService } from "@/lib/rh/services";
import type { NewEmployeeInput, WorkRegime } from "@/lib/rh/services";

export const Route = createFileRoute("/rh/colaboradores/novo")({
  head: () => ({
    meta: [
      { title: "Novo funcionário — Portal RH | MaaS Corporate AI" },
      {
        name: "description",
        content:
          "Cadastre um colaborador no programa de mobilidade corporativa: dados pessoais, contrato, política, limites e carteira digital.",
      },
      { property: "og:title", content: "Novo funcionário — Portal RH" },
      {
        property: "og:description",
        content: "Cadastro corporativo de colaborador com concessão de benefício de mobilidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovoColaboradorPage,
});

const MODALS = [
  "Transporte público",
  "Uber",
  "99",
  "Bicicleta",
  "Patinete",
] as const;

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const schema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail corporativo inválido").max(255),
  cpf: z.string().refine(isValidCpf, "CPF inválido"),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  birthDate: z.string().min(1, "Informe a data de nascimento"),
  department: z.string().trim().min(2, "Informe o departamento").max(80),
  position: z.string().trim().min(2, "Informe o cargo").max(80),
  registration: z.string().trim().min(2, "Informe a matrícula").max(40),
  costCenter: z.string().trim().min(1, "Informe o centro de custo").max(40),
  admissionDate: z.string().min(1, "Informe a data de admissão"),
  zipCode: z.string().refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido"),
  street: z.string().trim().min(3, "Informe o logradouro").max(140),
  number: z.string().trim().min(1, "Informe o número").max(12),
  district: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.string().length(2, "UF inválida"),
  monthlyLimit: z.number().min(0, "Valor inválido").max(100000),
  perTripCap: z.number().min(0, "Valor inválido").max(10000),
});

const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

const maskCep = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

const maskPhone = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

interface FormState {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  department: string;
  position: string;
  registration: string;
  costCenter: string;
  admissionDate: string;
  workRegime: WorkRegime;
  presentialDays: number;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  policyId: string;
  monthlyLimit: string;
  perTripCap: string;
  status: "ATIVO" | "INATIVO";
  sendInvite: boolean;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  cpf: "",
  phone: "",
  birthDate: "",
  department: "",
  position: "",
  registration: "",
  costCenter: "",
  admissionDate: "",
  workRegime: "HIBRIDO",
  presentialDays: 3,
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "SP",
  policyId: "",
  monthlyLimit: "600",
  perTripCap: "60",
  status: "ATIVO",
  sendInvite: true,
};

function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function NovoColaboradorPage() {
  const { can } = useRhSession();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modals, setModals] = useState<string[]>([
    "Transporte público",
    "Uber",
    "99",
    "Bicicleta",
  ]);
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: policies } = useQuery({
    queryKey: ["rh", "policies"],
    queryFn: () => policyService.list(),
  });

  if (!can("employees") || !can("write")) {
    return <NoAccess area="o cadastro de colaboradores" />;
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const lookupCep = async (raw: string) => {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        toast.error("CEP não encontrado", { description: "Preencha o endereço manualmente." });
        return;
      }
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        district: data.bairro || f.district,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP", {
        description: "Preencha o endereço manualmente.",
      });
    } finally {
      setCepLoading(false);
    }
  };

  const toggleModal = (modal: string, checked: boolean) =>
    setModals((current) =>
      checked ? [...new Set([...current, modal])] : current.filter((m) => m !== modal),
    );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      monthlyLimit: Number(form.monthlyLimit.replace(",", ".")),
      perTripCap: Number(form.perTripCap.replace(",", ".")),
    });

    const fieldErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }
    if (modals.length === 0) fieldErrors["modals"] = "Autorize ao menos um modal.";
    if (!form.policyId) fieldErrors["policyId"] = "Selecione a política de mobilidade.";

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0 || !parsed.success) {
      toast.error("Revise os campos destacados");
      return;
    }

    setSaving(true);
    try {
      const duplicate = await employeeService.checkDuplicate({
        email: parsed.data.email,
        cpf: parsed.data.cpf,
      });
      if (duplicate.emailTaken || duplicate.cpfTaken) {
        setErrors({
          ...(duplicate.emailTaken ? { email: "E-mail já cadastrado." } : {}),
          ...(duplicate.cpfTaken ? { cpf: "CPF já cadastrado." } : {}),
        });
        toast.error("Colaborador já cadastrado");
        return;
      }

      const payload: NewEmployeeInput = {
        name: parsed.data.name,
        email: parsed.data.email,
        cpf: parsed.data.cpf,
        phone: parsed.data.phone,
        birthDate: parsed.data.birthDate,
        department: parsed.data.department,
        position: parsed.data.position,
        registration: parsed.data.registration,
        costCenter: parsed.data.costCenter,
        admissionDate: parsed.data.admissionDate,
        workRegime: form.workRegime,
        presentialDays: form.workRegime === "HIBRIDO" ? form.presentialDays : 0,
        zipCode: parsed.data.zipCode,
        street: parsed.data.street,
        number: parsed.data.number,
        complement: form.complement,
        district: parsed.data.district,
        city: parsed.data.city,
        state: parsed.data.state,
        policyId: form.policyId,
        monthlyLimit: parsed.data.monthlyLimit,
        perTripCap: parsed.data.perTripCap,
        allowedModals: modals,
        status: form.status,
        sendInvite: form.sendInvite,
      };

      const created = await employeeService.create(payload);
      toast.success("Colaborador cadastrado", {
        description: form.sendInvite
          ? "Carteira digital criada e convite de primeiro acesso enviado (demonstração)."
          : "Carteira digital criada (demonstração).",
      });
      void navigate({ to: "/rh/colaboradores/$id", params: { id: created.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/rh" className="hover:text-foreground">Visão Geral</Link>
        <span>›</span>
        <Link to="/rh/colaboradores" className="hover:text-foreground">Colaboradores</Link>
        <span>›</span>
        <span className="text-foreground">Novo Funcionário</span>
      </nav>

      <RhPageHeader
        title="Novo funcionário"
        subtitle={`Cadastro corporativo de colaborador — ${companyContext.company}.`}
        action={
          <Button variant="outline" asChild>
            <Link to="/rh/colaboradores">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar à lista
            </Link>
          </Button>
        }
      />

      <DemoDataNotice />

      <form onSubmit={onSubmit} className="space-y-6">
        <RhSection title="Dados pessoais" description="Identificação do colaborador.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Nome completo" htmlFor="name" error={errors["name"]} className="lg:col-span-2">
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ana Paula Ribeiro" />
            </Field>
            <Field label="CPF" htmlFor="cpf" error={errors["cpf"]}>
              <Input id="cpf" value={form.cpf} onChange={(e) => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
            </Field>
            <Field label="E-mail corporativo" htmlFor="email" error={errors["email"]}>
              <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@empresa.com.br" />
            </Field>
            <Field label="Telefone / WhatsApp" htmlFor="phone" error={errors["phone"]}>
              <Input id="phone" value={form.phone} onChange={(e) => set("phone", maskPhone(e.target.value))} placeholder="(11) 99999-0000" inputMode="tel" />
            </Field>
            <Field label="Data de nascimento" htmlFor="birthDate" error={errors["birthDate"]}>
              <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </Field>
          </div>
        </RhSection>

        <RhSection title="Dados contratuais" description="Vínculo com a empresa e regime de trabalho.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Departamento" htmlFor="department" error={errors["department"]}>
              <Input id="department" list="rh-departments" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="Tecnologia" />
              <datalist id="rh-departments">
                {employeeService.departments().map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </Field>
            <Field label="Cargo" htmlFor="position" error={errors["position"]}>
              <Input id="position" value={form.position} onChange={(e) => set("position", e.target.value)} placeholder="Analista de Dados" />
            </Field>
            <Field label="Matrícula" htmlFor="registration" error={errors["registration"]}>
              <Input id="registration" value={form.registration} onChange={(e) => set("registration", e.target.value)} placeholder="MAT-10999" />
            </Field>
            <Field label="Centro de custo" htmlFor="costCenter" error={errors["costCenter"]}>
              <Input id="costCenter" value={form.costCenter} onChange={(e) => set("costCenter", e.target.value)} placeholder="CC-4021" />
            </Field>
            <Field label="Data de admissão" htmlFor="admissionDate" error={errors["admissionDate"]}>
              <Input id="admissionDate" type="date" value={form.admissionDate} onChange={(e) => set("admissionDate", e.target.value)} />
            </Field>
            <Field label="Regime de trabalho" htmlFor="workRegime">
              <Select value={form.workRegime} onValueChange={(v) => set("workRegime", v as WorkRegime)}>
                <SelectTrigger id="workRegime"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                  <SelectItem value="REMOTO">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.workRegime === "HIBRIDO" ? (
              <Field label="Dias presenciais por semana" htmlFor="presentialDays">
                <Select
                  value={String(form.presentialDays)}
                  onValueChange={(v) => set("presentialDays", Number(v))}
                >
                  <SelectTrigger id="presentialDays"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} dia{d > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
          </div>
        </RhSection>

        <RhSection title="Endereço residencial" description="Usado para estimar deslocamentos casa-trabalho.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="CEP" htmlFor="zipCode" error={errors["zipCode"]}>
              <div className="relative">
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => set("zipCode", maskCep(e.target.value))}
                  onBlur={(e) => void lookupCep(e.target.value)}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
                {cepLoading ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            </Field>
            <Field label="Logradouro" htmlFor="street" error={errors["street"]} className="lg:col-span-2">
              <Input id="street" value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Av. Paulista" />
            </Field>
            <Field label="Número" htmlFor="number" error={errors["number"]}>
              <Input id="number" value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="1000" />
            </Field>
            <Field label="Complemento" htmlFor="complement">
              <Input id="complement" value={form.complement} onChange={(e) => set("complement", e.target.value)} placeholder="Apto 42" />
            </Field>
            <Field label="Bairro" htmlFor="district" error={errors["district"]}>
              <Input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Bela Vista" />
            </Field>
            <Field label="Cidade" htmlFor="city" error={errors["city"]} className="lg:col-span-2">
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="São Paulo" />
            </Field>
            <Field label="UF" htmlFor="state" error={errors["state"]}>
              <Select value={form.state} onValueChange={(v) => set("state", v)}>
                <SelectTrigger id="state"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </RhSection>

        <RhSection
          title="Benefício e carteira digital"
          description="Política aplicada, limites e modais autorizados. A carteira é criada automaticamente."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Política de mobilidade" htmlFor="policyId" error={errors["policyId"]}>
              <Select value={form.policyId} onValueChange={(v) => set("policyId", v)}>
                <SelectTrigger id="policyId"><SelectValue placeholder="Selecione a política" /></SelectTrigger>
                <SelectContent>
                  {(policies ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Crédito mensal inicial (R$)" htmlFor="monthlyLimit" error={errors["monthlyLimit"]}>
              <Input id="monthlyLimit" value={form.monthlyLimit} onChange={(e) => set("monthlyLimit", e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Teto por viagem (R$)" htmlFor="perTripCap" error={errors["perTripCap"]}>
              <Input id="perTripCap" value={form.perTripCap} onChange={(e) => set("perTripCap", e.target.value)} inputMode="decimal" />
            </Field>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Modais autorizados</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MODALS.map((modal) => (
                <label
                  key={modal}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm"
                >
                  <span className="text-foreground">{modal}</span>
                  <Switch
                    checked={modals.includes(modal)}
                    onCheckedChange={(checked) => toggleModal(modal, checked)}
                    aria-label={modal}
                  />
                </label>
              ))}
            </div>
            {errors["modals"] ? (
              <p className="mt-2 text-xs text-destructive">{errors["modals"]}</p>
            ) : null}
          </div>
        </RhSection>

        <RhSection title="Acesso e convite" description="Status inicial do benefício e primeiro acesso do colaborador.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status inicial" htmlFor="status">
              <Select value={form.status} onValueChange={(v) => set("status", v as "ATIVO" | "INATIVO")}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo (ativar depois)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <Checkbox
                checked={form.sendInvite}
                onCheckedChange={(checked) => set("sendInvite", checked === true)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-foreground">Enviar convite de primeiro acesso</span>
                <span className="block text-xs text-muted-foreground">
                  O colaborador recebe um e-mail para criar a senha e acessar a carteira.
                </span>
              </span>
            </label>
          </div>
        </RhSection>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/rh/colaboradores">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-1.5 h-4 w-4" />
            )}
            Cadastrar funcionário
          </Button>
        </div>
      </form>
    </div>
  );
}
