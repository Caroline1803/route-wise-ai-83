import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alias corporativo: /company/employees/new -> /rh/colaboradores/novo */
export const Route = createFileRoute("/company/employees/new")({
  beforeLoad: () => {
    throw redirect({ to: "/rh/colaboradores/novo" });
  },
});
