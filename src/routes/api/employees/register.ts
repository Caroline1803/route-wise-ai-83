import { createFileRoute } from "@tanstack/react-router";
import { registerEmployeeCore } from "@/lib/employee/employee.server";

export const Route = createFileRoute("/api/employees/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const res = await registerEmployeeCore(body, request.headers.get("origin") ?? undefined);
        return Response.json(res, { status: res.ok ? 201 : 400 });
      },
    },
  },
});
