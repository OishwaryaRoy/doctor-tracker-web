export type Role = "admin" | "viewer";
export type PatientCondition =
  "stable" | "critical" | "recovering" | "under_observation" | "discharged";
export type Gender = "male" | "female" | "other";
export type SortOrder = "newest" | "oldest" | "name_asc" | "name_desc";
export type Interval = "day" | "week" | "month";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLoginAt: string | null;
};

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type Paginated<T> = { data: T[]; meta: PageMeta };

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DoctorDetail = Doctor & {
  patientsByCondition: Record<PatientCondition, number>;
};

export type DoctorOption = { id: string; name: string; specialization: string };

export type Patient = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  bloodGroup: string | null;
  condition: PatientCondition;
  diagnosis: string;
  admissionDate: string;
  notes: string | null;
  doctor: DoctorOption | null;
  createdAt: string;
  updatedAt: string;
};

export type MetaOptions = {
  specializations: string[];
  conditions: PatientCondition[];
  genders: Gender[];
  bloodGroups: string[];
  hospitals: string[];
};

export type StatsOverview = {
  range: { from: string; to: string; interval: Interval; timezone: string };
  totals: {
    doctors: number;
    patients: number;
    criticalPatients: number;
    avgPatientsPerDoctor: number;
  };
  period: { newPatients: number; previousNewPatients: number; changePct: number | null };
  timeline: { date: string; count: number; critical: number }[];
  byCondition: { condition: PatientCondition; count: number }[];
  byGender: { gender: Gender; count: number }[];
  ageGroups: { label: string; count: number }[];
  topDoctors: (DoctorOption & { count: number })[];
  doctorsBySpecialization: { specialization: string; count: number }[];
};
