"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Gender, Paginated, Patient, PatientCondition, SortOrder } from "@/lib/api/types";
import { doctorKeys } from "@/features/doctors/api";

export type PatientListParams = {
  page: number;
  limit: number;
  search?: string;
  condition?: string[];
  gender?: string[];
  doctor?: string;
  from?: string;
  to?: string;
  sort: SortOrder;
};

export type PatientInput = {
  name: string;
  email: string | null;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup: string | null;
  condition: PatientCondition;
  diagnosis: string;
  admissionDate: string;
  notes: string | null;
  doctor: string;
};

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
};

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: ({ signal }) => api.get<Paginated<Patient>>("/patients", params, signal),
    placeholderData: keepPreviousData,
  });
}

function useInvalidatePatientData() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: patientKeys.all }),
      queryClient.invalidateQueries({ queryKey: doctorKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["stats"] }),
    ]);
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: (input: PatientInput) => api.post<{ data: Patient }>("/patients", input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PatientInput> }) =>
      api.patch<{ data: Patient }>(`/patients/${id}`, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePatientData();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: patientKeys.lists() });
      const snapshots = queryClient.getQueriesData<Paginated<Patient>>({
        queryKey: patientKeys.lists(),
      });
      queryClient.setQueriesData<Paginated<Patient>>({ queryKey: patientKeys.lists() }, (old) => {
        if (!old || !old.data.some((patient) => patient.id === id)) return old;
        return {
          data: old.data.filter((patient) => patient.id !== id),
          meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
        };
      });
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]: [QueryKey, unknown]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: () => invalidate(),
  });
}
