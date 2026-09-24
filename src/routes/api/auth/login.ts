import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { checkLockCore, logAccessCore, publicClient } from "@/lib/employee/employee.server";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(255), password: z.string().min(1).max(72) });

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Credenciais inválidas" }, { status: 400 });
        const { email, password } = parsed.data;
        if ((await checkLockCore(email)).locked)
          return Response.json({ error: "Conta bloqueada temporariamente" }, { status: 429 });
        const sb = publicClient();
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        await logAccessCore(email, !error, data.user?.id);
        if (error || !data.session) return Response.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
        const { createClient } = await import("@supabase/supabase-js");
        const authed = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
        });
        const { data: roles } = await authed.from("user_roles").select("role").eq("user_id", data.user.id);
        const isEmployee = roles?.some((r) => r.role === "employee");
        return Response.json({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          role: isEmployee ? "EMPLOYEE" : "UNKNOWN",
          redirect_to: isEmployee ? "/employee/dashboard" : null,
        });
      },
    },
  },
});
