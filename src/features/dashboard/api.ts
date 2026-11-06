"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { api } from "@/lib/api/client";
import type { StatsOverview } from "@/lib/api/types";

export const RANGE_PRESETS = {
  "30d": { label: "Last 30 days", short: "30D", from: () => startOfDay(subDays(new Date(), 29)) },
  "90d": { label: "Last 90 days", short: "90D", from: () => startOfDay(subDays(new Date(), 89)) },
  "12m": {
    label: "Last 12 months",
    short: "12M",
    from: () => startOfMonth(subMonths(new Date(), 11)),
  },
  "24m": {
    label: "Last 24 months",
    short: "24M",
    from: () => startOfMonth(subMonths(new Date(), 23)),
  },
} as const;

export type RangePreset = keyof typeof RANGE_PRESETS;

export function useOverview(range: RangePreset) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: ["stats", "overview", { range, timeZone }],
    queryFn: ({ signal }) =>
      api.get<{ data: StatsOverview }>(
        "/stats/overview",
        { from: RANGE_PRESETS[range].from().toISOString(), tz: timeZone },
        signal,
      ),
    select: (response) => response.data,
    placeholderData: keepPreviousData,
    refetchInterval: 5 * 60_000,
  });
}
