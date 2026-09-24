import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { registerSchema } from "./validation";

export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export type RegisterOutcome =
  | { ok: true; status: "PENDING" | "ACTIVE" }
  | { ok: false; error: string; field?: string };

export async function registerEmployeeCore(raw: unknown, origin?: string): Promise<RegisterOutcome> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]!;
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const d = parsed.data;
  const db = await admin();

  const { data: company } = await db.from("companies").select("id, auto_activate, default_monthly_credit").eq("id", d.company_id).maybeSingle();
  if (!company) return { ok: false, error: "Empresa não cadastrada.", field: "company_id" };

  const { data: dupEmail } = await db.from("employees").select("user_id").eq("email", d.email).maybeSingle();
  if (dupEmail) return { ok: false, error: "Este e-mail já está cadastrado.", field: "email" };
  const { data: dupCpf } = await db.from("employees").select("user_id").eq("cpf", d.cpf).maybeSingle();
  if (dupCpf) return { ok: false, error: "Este CPF já está cadastrado.", field: "cpf" };

  // 1. Criar usuário (senha é armazenada com hash pelo serviço de autenticação) + e-mail de confirmação
  const { data: signUp, error: signErr } = await publicClient().auth.signUp({
    email: d.email,
    password: d.password,
    options: { ...(origin ? { emailRedirectTo: `${origin}/employee/login` } : {}), data: { name: d.name, role: "EMPLOYEE" } },
  });
  const userId = signUp.user?.id;
  if (signErr?.message.toLowerCase().includes("weak")) {
    return { ok: false, error: "Senha muito comum ou vazada. Escolha outra senha forte.", field: "password" };
  }
  if (signErr) console.error("[register] signUp", signErr.message);
  if (signErr || !userId || (signUp.user?.identities?.length ?? 1) === 0) {
    return { ok: false, error: signErr?.message?.includes("registered") ? "Este e-mail já está cadastrado." : "Não foi possível criar o usuário.", field: "email" };
  }

  const status = company.auto_activate ? "ACTIVE" : "PENDING";
  const { password: _pw, ...profile } = d;
  // 2-5. Colaborador, vínculo com empresa, política, perfil e carteira
  const { error: empErr } = await db.from("employees").insert({ ...profile, user_id: userId, status, policy_name: "Política padrão" });
  if (empErr) {
    await db.auth.admin.deleteUser(userId);
    return { ok: false, error: "Não foi possível concluir o cadastro." };
  }
  await db.from("user_roles").insert({ user_id: userId, role: "employee" });
  await db.from("wallets").insert({ user_id: userId, corporate_credit: company.default_monthly_credit });
  await db.from("access_logs").insert({ email: d.email, user_id: userId, event: "REGISTER", success: true });
  return { ok: true, status };
}

export async function checkLockCore(email: string) {
  const db = await admin();
  const since = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const { data } = await db
    .from("access_logs")
    .select("success, created_at")
    .eq("email", email.toLowerCase())
    .eq("event", "LOGIN")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ATTEMPTS);
  let fails = 0;
  for (const r of data ?? []) {
    if (r.success) break;
    fails++;
  }
  return { locked: fails >= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - fails) };
}

export async function logAccessCore(email: string, success: boolean, userId?: string) {
  const db = await admin();
  await db.from("access_logs").insert({ email: email.toLowerCase(), success, event: "LOGIN", user_id: userId ?? null });
}
