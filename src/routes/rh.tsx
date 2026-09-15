import { Outlet, createFileRoute } from "@tanstack/react-router";

import { RhShell } from "@/components/rh/RhShell";
import { RhSessionProvider } from "@/lib/rh/rbac";
import { companyContext } from "@/lib/rh/services";

export const Route = createFileRoute("/rh")({
  component: RhLayout,
});

function RhLayout() {
  return (
    <RhSessionProvider company={companyContext.company}>
      <RhShell>
        <Outlet />
      </RhShell>
    </RhSessionProvider>
  );
}
