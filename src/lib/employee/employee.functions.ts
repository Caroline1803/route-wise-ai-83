import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcEstimate, costPerTripFor, type TransportMode } from "@/lib/estimate/calc";
import { checkLockCore, logAccessCore, registerEmployeeCore } from "./employee.server";

export const listCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const { publicClient } = await import("./employee.server");
  const { data } = await publicClient().from("companies").select("id, name").order("name");
  return data ?? [];
});

export const registerEmployee = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d)
  .handler(async ({ data }) => registerEmployeeCore(data, getRequestHeader("origin") ?? undefined));

const emailSchema = z.object({ email: z.string().trim().email().max(255) });

export const checkLoginLock = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => checkLockCore(data.email));

export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.extend({ success: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await logAccessCore(data.email, data.success);
    return checkLockCore(data.email);
  });

export const getEmployeeDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [emp, wallet, roles, last] = await Promise.all([
      supabase.from("employees").select("name, email, status, department, position, company_id, companies(name)").eq("user_id", userId).maybeSingle(),
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("spending_estimates").select("estimated_monthly_cost").order("created_at", { ascending: false }).limit(1),
    ]);
    const w = wallet.data;
    const balance = Number(w?.balance ?? 420);
    const spent = Number(w?.spent_this_month ?? 186.5);
    const credit = Number(w?.corporate_credit ?? 350);
    // Estimativa até o fim do mês: última estimativa salva ou projeção padrão (MOCK)
    const projected = last.data?.[0] ? Number(last.data[0].estimated_monthly_cost) : 275;
    const estimateToEnd = Math.max(spent, Math.round(projected * 100) / 100);
    return {
      employee: emp.data,
      roles: (roles.data ?? []).map((r) => r.role),
      wallet: { balance, credit, cashback: Number(w?.cashback ?? 35), spent },
      estimateToEnd,
      projectedBalance: Math.round((balance - estimateToEnd) * 100) / 100,
    };
  });

const estimateSchema = z.object({
  origin: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  transport_mode: z.enum(["public_transport", "bus", "metro", "bike", "scooter", "99", "uber", "multimodal"]),
  trips_per_day: z.number().int().min(1).max(10),
  days_per_week: z.number().int().min(1).max(7),
  working_days_month: z.number().int().min(1).max(31),
  cost_per_trip: z.number().min(0).max(1000).optional(),
});

export const saveEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => estimateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: w } = await context.supabase.from("wallets").select("corporate_credit").eq("user_id", context.userId).maybeSingle();
    const credit = Number(w?.corporate_credit ?? 350);
    const cpt = data.cost_per_trip ?? costPerTripFor(data.transport_mode as TransportMode);
    const r = calcEstimate({ costPerTrip: cpt, tripsPerDay: data.trips_per_day, daysPerWeek: data.days_per_week, workingDaysMonth: data.working_days_month, corporateCredit: credit });
    const { error } = await context.supabase.from("spending_estimates").insert({
      user_id: context.userId,
      origin: data.origin,
      destination: data.destination,
      transport_mode: data.transport_mode,
      trips_per_day: data.trips_per_day,
      days_per_week: data.days_per_week,
      working_days_month: data.working_days_month,
      estimated_daily_cost: r.daily_cost,
      estimated_weekly_cost: r.weekly_cost,
      estimated_monthly_cost: r.monthly_cost,
      corporate_credit: credit,
      estimated_remaining_balance: r2diff(credit, r.monthly_cost),
    });
    if (error) throw new Error("Não foi possível salvar a estimativa.");
    return r;
  });

const r2diff = (a: number, b: number) => Math.round((a - b) * 100) / 100;

export const listEstimates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("spending_estimates").select("*").order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const deleteEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("spending_estimates").delete().eq("id", data.id);
    return { ok: true };
  });

export const getWalletCredit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("wallets").select("corporate_credit").eq("user_id", context.userId).maybeSingle();
    return { credit: Number(data?.corporate_credit ?? 350) };
  });

