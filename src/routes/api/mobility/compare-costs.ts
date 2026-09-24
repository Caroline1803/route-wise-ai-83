import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { compareCosts } from "@/lib/estimate/calc";

const schema = z.object({
  trips_per_day: z.number().int().min(1).max(10).default(2),
  working_days_month: z.number().int().min(1).max(31).default(22),
});

export const Route = createFileRoute("/api/mobility/compare-costs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse((await request.json().catch(() => ({}))) ?? {});
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
        return Response.json(
          compareCosts(parsed.data.trips_per_day, parsed.data.working_days_month).map((c) => ({ mode: c.mode, monthly_cost: c.monthly_cost })),
        );
      },
    },
  },
});
