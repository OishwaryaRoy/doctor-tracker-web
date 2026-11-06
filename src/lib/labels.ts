import type { Gender, PatientCondition } from "@/lib/api/types";

export const CONDITION_ORDER: PatientCondition[] = [
  "stable",
  "recovering",
  "under_observation",
  "critical",
  "discharged",
];

export const CONDITION_META: Record<
  PatientCondition,
  { label: string; color: string; dot: string; badge: string }
> = {
  stable: {
    label: "Stable",
    color: "var(--condition-stable)",
    dot: "bg-condition-stable",
    badge: "bg-condition-stable/10 border-condition-stable/30",
  },
  recovering: {
    label: "Recovering",
    color: "var(--condition-recovering)",
    dot: "bg-condition-recovering",
    badge: "bg-condition-recovering/10 border-condition-recovering/30",
  },
  under_observation: {
    label: "Under observation",
    color: "var(--condition-observation)",
    dot: "bg-condition-observation",
    badge: "bg-condition-observation/12 border-condition-observation/35",
  },
  critical: {
    label: "Critical",
    color: "var(--condition-critical)",
    dot: "bg-condition-critical",
    badge: "bg-condition-critical/10 border-condition-critical/35",
  },
  discharged: {
    label: "Discharged",
    color: "var(--condition-discharged)",
    dot: "bg-condition-discharged",
    badge: "bg-condition-discharged/10 border-condition-discharged/30",
  },
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const SORT_LABELS = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name A–Z",
  name_desc: "Name Z–A",
} as const;
