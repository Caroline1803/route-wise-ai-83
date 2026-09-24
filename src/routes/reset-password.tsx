import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/mobility/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { strongPassword } from "@/lib/employee/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — MaaS Corporate AI" },
      { name: "description", content: "Defina uma nova senha para sua conta de colaborador." },
      { property: "og:title", content: "Redefinir senha — MaaS Corporate AI" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password"));
    const ok = strongPassword.safeParse(pw);
    if (!ok.success) { toast.error(ok.error.issues[0]!.message); return; }
    if (pw !== fd.get("confirm")) { toast.error("As senhas não conferem."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error("Link inválido ou expirado."); return; }
    toast.success("Senha atualizada!");
    navigate({ to: "/employee/dashboard" });
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-14">
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-card/85 p-7 shadow-soft">
          <h1 className="font-display text-2xl font-bold text-foreground">Nova senha</h1>
          <div><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" className="mt-1.5" /></div>
          <div><Label htmlFor="confirm">Confirmar senha</Label><Input id="confirm" name="confirm" type="password" className="mt-1.5" /></div>
          <Button type="submit" className="w-full" disabled={busy}>Salvar senha</Button>
        </form>
      </main>
    </div>
  );
}
