"use client";

import {
  parseAsInteger,
  useQueryStates,
  type inferParserType,
  type UseQueryStatesKeysMap,
} from "nuqs";
import { useCallback } from "react";
import { PAGE_SIZES } from "@/components/shared/pagination-bar";

export const pageParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
};

export function useListState<T extends UseQueryStatesKeysMap>(parsers: T) {
  const [state, setState] = useQueryStates(
    { ...pageParsers, ...parsers },
    { history: "replace", scroll: false, clearOnDefault: true },
  );
  type Values = inferParserType<typeof pageParsers & T>;

  const setFilters = useCallback(
    (patch: Partial<Omit<Values, "page" | "limit">>) =>
      setState({ ...patch, page: 1 } as Parameters<typeof setState>[0]),
    [setState],
  );

  const setPage = useCallback(
    (page: number) => {
      setState({ page } as Parameters<typeof setState>[0], { history: "push" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setState],
  );

  const setLimit = useCallback(
    (limit: number) => setState({ limit, page: 1 } as Parameters<typeof setState>[0]),
    [setState],
  );

  const reset = useCallback(() => setState(null), [setState]);

  const values = state as Values;
  return {
    state: { ...values, limit: PAGE_SIZES.includes(values.limit) ? values.limit : 10 },
    setFilters,
    setPage,
    setLimit,
    reset,
  };
}
