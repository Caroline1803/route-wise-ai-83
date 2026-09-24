import { z } from "zod";

export function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const strongPassword = z
  .string()
  .min(8, "Mínimo de 8 caracteres")
  .max(72)
  .regex(/[A-Z]/, "Inclua uma letra maiúscula")
  .regex(/[a-z]/, "Inclua uma letra minúscula")
  .regex(/\d/, "Inclua um número")
  .regex(/[^A-Za-z0-9]/, "Inclua um símbolo");

export const registerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(255),
  cpf: z.string().transform((v) => v.replace(/\D/g, "")).refine(isValidCpf, "CPF inválido"),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  company_id: z.coerce.number().int().positive("Selecione a empresa"),
  department: z.string().trim().min(2, "Obrigatório").max(80),
  position: z.string().trim().min(2, "Obrigatório").max(80),
  cost_center: z.string().trim().min(2, "Obrigatório").max(30),
  employee_number: z.string().trim().min(2, "Obrigatório").max(30),
  admission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  address: z.string().trim().min(5, "Obrigatório").max(200),
  zip_code: z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 8, "CEP inválido"),
  city: z.string().trim().min(2, "Obrigatório").max(80),
  state: z.string().trim().length(2, "Use a sigla (ex.: SP)").transform((v) => v.toUpperCase()),
  password: strongPassword,
});

export type RegisterInput = z.input<typeof registerSchema>;
