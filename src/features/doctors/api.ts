"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Doctor, DoctorDetail, DoctorOption, Paginated, SortOrder } from "@/lib/api/types";

export type DoctorListParams = {
  page: number;
  limit: number;
  search?: string;
  specialization?: string[];
  hospital?: string;
  from?: string;
  to?: string;
  sort: SortOrder;
};

export type DoctorInput = {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
};

export const doctorKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorKeys.all, "list"] as const,
  list: (params: DoctorListParams) => [...doctorKeys.lists(), params] as const,
  detail: (id: string) => [...doctorKeys.all, "detail", id] as const,
  lookup: (search: string) => [...doctorKeys.all, "lookup", search] as const,
};

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: ({ signal }) => api.get<Paginated<Doctor>>("/doctors", params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string, enabled = true) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: ({ signal }) => api.get<{ data: DoctorDetail }>(`/doctors/${id}`, undefined, signal),
    select: (response) => response.data,
    enabled: enabled && Boolean(id),
  });
}

export function useDoctorLookup(search: string, enabled = true) {
  return useQuery({
    queryKey: doctorKeys.lookup(search),
    queryFn: ({ signal }) =>
      api.get<{ data: DoctorOption[] }>("/doctors/lookup", { search, limit: 20 }, signal),
    select: (response) => response.data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });
}

function useInvalidateDoctorData() {
  const queryClient = useQueryClient();
  return (options: { includePatients?: boolean } = {}) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: doctorKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["meta"] }),
      queryClient.invalidateQueries({ queryKey: ["stats"] }),
      options.includePatients && queryClient.invalidateQueries({ queryKey: ["patients"] }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (input: DoctorInput) => api.post<{ data: Doctor }>("/doctors", input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateDoctor(id: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (input: Partial<DoctorInput>) =>
      api.patch<{ data: Doctor }>(`/doctors/${id}`, input),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<{ data: DoctorDetail }>(doctorKeys.detail(id), (old) =>
        old ? { data: { ...old.data, ...data } } : old,
      );
      return invalidate({ includePatients: true });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateDoctorData();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/doctors/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: doctorKeys.detail(id) });
      return invalidate();
    },
  });
}
