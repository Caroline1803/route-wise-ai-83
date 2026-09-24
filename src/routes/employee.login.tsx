import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { checkLoginLock, recordLoginAttempt } from "@/lib/employee/employee.functions";

export const Route = createFileRoute("/employee/login")({
  head: () => ({
    meta: [
      { title: "Login do colaborador — MaaS Corporate AI" },
      { name: "description", content: "Acesse sua carteira de mobilidade corporativa, saldo e estimativas de gastos." },
      { property: "og:title", content: "Login do colaborador — MaaS Corporate AI" },
      { property: "og:description", content: "Acesse sua carteira de mobilidade corporativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const checkLock = useServerFn(checkLoginLock);
  const record = useServerFn(recordLoginAttempt);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const mail = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    const remember = fd.get("remember") === "1";
    if (!mail || !password) { toast.error("Informe e-mail e senha."); return; }
    setBusy(true);
    try {
      const lock = await checkLock({ data: { email: mail } });
      if (lock.locked) { toast.error("Acesso bloqueado por 15 minutos após várias tentativas incorretas."); return; }
      const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
      await record({ data: { email: mail, success: !error } });
      if (error || !data.user) {
        const left = Math.max(0, lock.remaining - 1);
        { toast.error(
          error?.message.includes("confirm") ? "Confirme seu e-mail antes de entrar." : `E-mail ou senha incorretos. ${left} tentativa(s) restante(s).`,
        ); return; }
      }
      if (!remember) sessionStorage.setItem("maas-session-only", "1");
      else sessionStorage.removeItem("maas-session-only");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (roles?.some((r) => r.role === "employee")) navigate({ to: "/employee/dashboard" });
      else {
        toast.error("Este acesso não possui perfil de colaborador.");
        await supabase.auth.signOut();
      }
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) { toast.error("Digite seu e-mail corporativo primeiro."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error("Não foi possível enviar o e-mail.");
    else toast.success("Enviamos um link para redefinir sua senha.");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-lg border border-border bg-card/85 p-7 shadow-soft backdrop-blur">
          <h1 className="font-display text-2xl font-bold text-foreground">Entrar como colaborador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Veja seu saldo, gastos e planeje suas viagens.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input id="email" name="email" type="email" autoComplete="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-foreground">
                <input type="checkbox" name="remember" value="1" defaultChecked className="h-4 w-4 accent-[var(--primary)]" />
                Lembrar de mim
              </label>
              <button type="button" onClick={forgot} className="text-primary hover:underline">Esqueci minha senha</button>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
          </form>
          <div className="mt-6 flex justify-between text-sm">
            <button type="button" onClick={forgot} className="text-muted-foreground hover:text-foreground">Primeiro acesso</button>
            <Link to="/employee/register" className="font-medium text-primary hover:underline">Criar cadastro</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
