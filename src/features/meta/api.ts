"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MetaOptions } from "@/lib/api/types";

export const metaKeys = { options: ["meta", "options"] as const };

export function useOptions() {
  return useQuery({
    queryKey: metaKeys.options,
    queryFn: ({ signal }) => api.get<{ data: MetaOptions }>("/meta/options", undefined, signal),
    select: (response) => response.data,
    staleTime: 10 * 60_000,
  });
}
