"use client";

import { MoreHorizontal, Pencil, Stethoscope, Trash2, UserRoundX, UsersRound } from "lucide-react";
import Link from "next/link";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConditionBadge } from "@/components/shared/condition-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DateRangeFilter, dayRangeToQuery } from "@/components/shared/date-range-filter";
import { FacetedFilter } from "@/components/shared/faceted-filter";
import { FilterToolbar, SortSelect } from "@/components/shared/filter-toolbar";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/features/auth/session-context";
import { DoctorPicker } from "@/features/doctors/doctor-picker";
import { useOptions } from "@/features/meta/api";
import { useListState } from "@/hooks/use-list-state";
import { errorMessage } from "@/lib/api/client";
import type { DoctorOption, Patient } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { CONDITION_META, GENDER_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { useDoctor } from "@/features/doctors/api";
import { useDeletePatient, usePatients } from "./api";
import { PatientFormSheet } from "./patient-form-sheet";

const SORTS = ["newest", "oldest", "name_asc", "name_desc"] as const;

const filterParsers = {
  search: parseAsString.withDefault(""),
  condition: parseAsArrayOf(parseAsString).withDefault([]),
  gender: parseAsArrayOf(parseAsString).withDefault([]),
  doctor: parseAsString,
  from: parseAsString,
  to: parseAsString,
  sort: parseAsStringLiteral(SORTS).withDefault("newest"),
};

export function PatientList({ doctor, onAdd }: { doctor?: DoctorOption; onAdd?: () => void }) {
  const { canEdit } = useSession();
  const options = useOptions();
  const { state, setFilters, setPage, setLimit, reset } = useListState(filterParsers);
  const [doctorFilter, setDoctorFilter] = useState<DoctorOption | null>(null);
  const needsDoctorName = !doctor && Boolean(state.doctor) && doctorFilter?.id !== state.doctor;
  const doctorFromUrl = useDoctor(state.doctor ?? "", needsDoctorName);
  const selectedDoctor: DoctorOption | null = !state.doctor
    ? null
    : doctorFilter?.id === state.doctor
      ? doctorFilter
      : doctorFromUrl.data
        ? doctorFromUrl.data
        : { id: state.doctor, name: "…", specialization: "" };

  const doctorId = doctor?.id ?? state.doctor ?? undefined;
  const patients = usePatients({
    page: state.page,
    limit: state.limit,
    search: state.search || undefined,
    condition: state.condition,
    gender: state.gender,
    doctor: doctorId,
    sort: state.sort,
    ...dayRangeToQuery(state.from, state.to),
  });

  const [editing, setEditing] = useState<Patient | undefined>();
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const remove = useDeletePatient();

  const activeCount =
    (state.search ? 1 : 0) +
    (state.condition.length ? 1 : 0) +
    (state.gender.length ? 1 : 0) +
    (!doctor && state.doctor ? 1 : 0) +
    (state.from || state.to ? 1 : 0);

  const onSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);

  const columns = useMemo<Column<Patient>[]>(() => {
    const list: Column<Patient>[] = [
      {
        id: "name",
        header: "Patient",
        cell: (patient) => <PatientIdentity patient={patient} />,
      },
      {
        id: "age",
        header: "Age · Sex",
        hideBelow: "lg",
        cell: (patient) => (
          <span className="tabular text-muted-foreground">
            {patient.age} · {GENDER_LABELS[patient.gender]}
          </span>
        ),
      },
      {
        id: "condition",
        header: "Condition",
        cell: (patient) => <ConditionBadge condition={patient.condition} />,
      },
      {
        id: "diagnosis",
        header: "Diagnosis",
        hideBelow: "xl",
        cell: (patient) => <span className="text-muted-foreground">{patient.diagnosis}</span>,
      },
    ];
    if (!doctor) {
      list.push({
        id: "doctor",
        header: "Doctor",
        hideBelow: "lg",
        cell: (patient) =>
          patient.doctor ? (
            <Link
              href={`/doctors/${patient.doctor.id}`}
              className="hover:text-primary hover:underline"
            >
              Dr. {patient.doctor.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      });
    }
    list.push(
      {
        id: "admitted",
        header: "Admitted",
        cell: (patient) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(patient.admissionDate)}
          </span>
        ),
      },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        className: "w-12",
        cell: (patient) =>
          canEdit ? (
            <PatientActions
              patient={patient}
              fromDoctor={Boolean(doctor)}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ) : null,
      },
    );
    return list;
  }, [doctor, canEdit]);

  const confirmDelete = () => {
    if (!deleting) return;
    const patient = deleting;
    setDeleting(null);
    remove.mutate(patient.id, {
      onSuccess: () => toast.success("Patient removed", { description: patient.name }),
      onError: (error) =>
        toast.error("Couldn't remove patient", { description: errorMessage(error) }),
    });
  };

  return (
    <>
      <FilterToolbar
        activeCount={activeCount}
        onReset={() => {
          setDoctorFilter(null);
          reset();
        }}
        search={
          <SearchInput
            value={state.search}
            onChange={onSearch}
            placeholder="Search name, email, phone…"
            label="Search patients"
          />
        }
        end={<SortSelect value={state.sort} onChange={(sort) => setFilters({ sort })} />}
      >
        <FacetedFilter
          title="Condition"
          options={(options.data?.conditions ?? []).map((value) => ({
            value,
            label: CONDITION_META[value].label,
            icon: <span className={cn("size-2 rounded-full", CONDITION_META[value].dot)} />,
          }))}
          selected={state.condition}
          onChange={(condition) => setFilters({ condition })}
        />
        <FacetedFilter
          title="Gender"
          options={(options.data?.genders ?? []).map((value) => ({
            value,
            label: GENDER_LABELS[value],
          }))}
          selected={state.gender}
          onChange={(gender) => setFilters({ gender })}
        />
        {!doctor && (
          <DoctorPicker
            value={selectedDoctor}
            onChange={(selected) => {
              setDoctorFilter(selected);
              setFilters({ doctor: selected?.id ?? null });
            }}
            placeholder="Any doctor"
            allowClear="Any doctor"
            className="h-9 w-auto min-w-36 border-dashed"
          />
        )}
        <DateRangeFilter
          title="Admitted"
          from={state.from}
          to={state.to}
          onChange={(range) => setFilters(range)}
        />
      </FilterToolbar>

      {patients.isError ? (
        <ErrorState error={patients.error} onRetry={() => patients.refetch()} />
      ) : (
        <>
          <DataTable
            caption={doctor ? `Patients of Dr. ${doctor.name}` : "Patients"}
            columns={columns}
            rows={patients.data?.data}
            getRowId={(patient) => patient.id}
            isLoading={patients.isPending}
            isFetching={patients.isPlaceholderData}
            renderMobileCard={(patient) => (
              <PatientCard
                patient={patient}
                showDoctor={!doctor}
                actions={
                  canEdit && (
                    <PatientActions
                      patient={patient}
                      fromDoctor={Boolean(doctor)}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  )
                }
              />
            )}
            empty={
              activeCount > 0 ? (
                <EmptyState
                  title="No patients match your filters"
                  description="Try a different search or clear the filters."
                  action={
                    <Button variant="outline" onClick={reset}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<UsersRound />}
                  title={doctor ? "No patients yet" : "No patients registered"}
                  description={
                    doctor
                      ? `Dr. ${doctor.name} has no patients assigned.`
                      : "Patients you add will appear here."
                  }
                  action={canEdit && onAdd && <Button onClick={onAdd}>Add patient</Button>}
                />
              )
            }
          />
          {patients.data && patients.data.meta.total > 0 && (
            <PaginationBar
              meta={patients.data.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
              itemLabel="patients"
            />
          )}
        </>
      )}

      <PatientFormSheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        patient={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={
          doctor
            ? `Remove ${deleting?.name ?? "patient"} from this doctor?`
            : `Delete ${deleting?.name ?? "patient"}?`
        }
        description="The patient record will be permanently deleted. This can't be undone."
        confirmLabel={doctor ? "Remove patient" : "Delete patient"}
        onConfirm={confirmDelete}
      />
    </>
  );
}

function PatientIdentity({ patient }: { patient: Patient }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={cn("h-8 w-1 shrink-0 rounded-full", CONDITION_META[patient.condition].dot)}
        aria-hidden
      />
      <span className="min-w-0">
        <span className="block truncate font-medium">{patient.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {patient.email ?? patient.phone}
        </span>
      </span>
    </span>
  );
}

function PatientActions({
  patient,
  fromDoctor,
  onEdit,
  onDelete,
}: {
  patient: Patient;
  fromDoctor: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${patient.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onEdit(patient)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        {!fromDoctor && patient.doctor && (
          <DropdownMenuItem asChild>
            <Link href={`/doctors/${patient.doctor.id}`}>
              <Stethoscope /> View doctor
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(patient)}>
          {fromDoctor ? <UserRoundX /> : <Trash2 />}
          {fromDoctor ? "Remove from list" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PatientCard({
  patient,
  showDoctor,
  actions,
}: {
  patient: Patient;
  showDoctor: boolean;
  actions: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <PatientIdentity patient={patient} />
        {actions}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ConditionBadge condition={patient.condition} />
        <span className="text-sm text-muted-foreground">
          {patient.age} · {GENDER_LABELS[patient.gender]}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Diagnosis</dt>
        <dd className="truncate text-right">{patient.diagnosis}</dd>
        {showDoctor && patient.doctor && (
          <>
            <dt className="text-muted-foreground">Doctor</dt>
            <dd className="truncate text-right">
              <Link
                href={`/doctors/${patient.doctor.id}`}
                className="hover:text-primary hover:underline"
              >
                Dr. {patient.doctor.name}
              </Link>
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Admitted</dt>
        <dd className="text-right">{formatDate(patient.admissionDate)}</dd>
      </dl>
    </div>
  );
}
