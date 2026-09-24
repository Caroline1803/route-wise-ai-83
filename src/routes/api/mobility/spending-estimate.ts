import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { calcEstimate, costPerTripFor, type TransportMode } from "@/lib/estimate/calc";

const schema = z.object({
  user_id: z.union([z.number(), z.string()]).optional(),
  origin: z.string().max(120).optional(),
  destination: z.string().max(120).optional(),
  trips_per_day: z.number().int().min(1).max(10),
  days_per_week: z.number().int().min(1).max(7),
  working_days_month: z.number().int().min(1).max(31),
  transport_mode: z.enum(["public_transport", "bus", "metro", "bike", "scooter", "99", "uber"]),
  corporate_credit: z.number().min(0).max(100000).optional(),
});

export const Route = createFileRoute("/api/mobility/spending-estimate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
        const d = parsed.data;
        const r = calcEstimate({
          costPerTrip: costPerTripFor(d.transport_mode as TransportMode),
          tripsPerDay: d.trips_per_day,
          daysPerWeek: d.days_per_week,
          workingDaysMonth: d.working_days_month,
          corporateCredit: d.corporate_credit ?? 350,
        });
        return Response.json({
          daily_cost: r.daily_cost,
          weekly_cost: r.weekly_cost,
          monthly_cost: r.monthly_cost,
          corporate_credit: r.corporate_credit,
          remaining_balance: r.remaining_balance,
          coverage_percentage: r.coverage_percentage,
        });
      },
    },
  },
});
