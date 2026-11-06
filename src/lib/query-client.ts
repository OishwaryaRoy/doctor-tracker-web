import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

function handleUnauthorized(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 401) return;
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/signout?next=${next}`);
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: handleUnauthorized }),
    mutationCache: new MutationCache({ onError: handleUnauthorized }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.status >= 400 && error.status < 500
            ? false
            : failureCount < 2,
      },
      mutations: { retry: false },
    },
  });
}
