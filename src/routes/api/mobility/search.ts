import { createFileRoute } from "@tanstack/react-router";

/** POST /api/mobility/search — endpoint REST interno da MaaS Backend API. */
export const Route = createFileRoute("/api/mobility/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { runMobilitySearch, validateSearchInput } = await import(
          "@/lib/mobility/search.server"
        );
        try {
          const body = await request.json();
          const result = await runMobilitySearch(validateSearchInput(body));
          return Response.json(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Requisição inválida";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
