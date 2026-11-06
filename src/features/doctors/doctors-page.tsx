"use client";

import {
  Building2,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, parseAsArrayOf } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { DateRangeFilter, dayRangeToQuery } from "@/components/shared/date-range-filter";
import { FacetedFilter } from "@/components/shared/faceted-filter";
import { FilterToolbar, SortSelect } from "@/components/shared/filter-toolbar";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/features/auth/session-context";
import { useOptions } from "@/features/meta/api";
import { useListState } from "@/hooks/use-list-state";
import type { Doctor } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { formatNumber, initials } from "@/lib/utils";
import { useDoctors } from "./api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";

const SORTS = ["newest", "oldest", "name_asc", "name_desc"] as const;
const ALL = "__all";

const filterParsers = {
  search: parseAsString.withDefault(""),
  specialization: parseAsArrayOf(parseAsString).withDefault([]),
  hospital: parseAsString.withDefault(""),
  from: parseAsString,
  to: parseAsString,
  sort: parseAsStringLiteral(SORTS).withDefault("newest"),
};

export function DoctorsPage() {
  const { canEdit } = useSession();
  const { state, setFilters, setPage, setLimit, reset } = useListState(filterParsers);
  const options = useOptions();

  const params = {
    page: state.page,
    limit: state.limit,
    search: state.search || undefined,
    specialization: state.specialization,
    hospital: state.hospital || undefined,
    sort: state.sort,
    ...dayRangeToQuery(state.from, state.to),
  };
  const doctors = useDoctors(params);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | undefined>();
  const [deleting, setDeleting] = useState<Doctor | null>(null);

  const openEdit = useCallback((doctor: Doctor) => {
    setEditing(doctor);
    setFormOpen(true);
  }, []);

  const activeCount =
    (state.search ? 1 : 0) +
    (state.specialization.length > 0 ? 1 : 0) +
    (state.hospital ? 1 : 0) +
    (state.from || state.to ? 1 : 0);

  const onSearch = useCallback((search: string) => setFilters({ search }), [setFilters]);

  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        id: "name",
        header: "Doctor",
        cell: (doctor) => <DoctorIdentity doctor={doctor} />,
      },
      {
        id: "specialization",
        header: "Specialization",
        cell: (doctor) => (
          <Badge variant="secondary" className="font-normal">
            {doctor.specialization}
          </Badge>
        ),
      },
      {
        id: "hospital",
        header: "Hospital",
        hideBelow: "lg",
        cell: (doctor) => <span className="text-muted-foreground">{doctor.hospital}</span>,
      },
      {
        id: "phone",
        header: "Phone",
        hideBelow: "xl",
        cell: (doctor) => <span className="tabular text-muted-foreground">{doctor.phone}</span>,
      },
      {
        id: "patients",
        header: <span className="block text-right">Patients</span>,
        cell: (doctor) => (
          <Link
            href={`/doctors/${doctor.id}`}
            className="tabular block text-right font-medium hover:text-primary hover:underline"
          >
            {formatNumber(doctor.patientCount)}
          </Link>
        ),
      },
      {
        id: "joined",
        header: "Added",
        hideBelow: "lg",
        cell: (doctor) => (
          <span className="text-muted-foreground">{formatDate(doctor.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        className: "w-12",
        cell: (doctor) => (
          <DoctorActions
            doctor={doctor}
            canEdit={canEdit}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        ),
      },
    ],
    [canEdit, openEdit],
  );

  return (
    <>
      <PageHeader
        title="Doctors"
        description={
          doctors.data
            ? `${formatNumber(doctors.data.meta.total)} ${doctors.data.meta.total === 1 ? "doctor" : "doctors"}${activeCount ? " match your filters" : ""}`
            : "Manage doctors and the patients under their care."
        }
        actions={
          canEdit && (
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <Plus /> Add doctor
            </Button>
          )
        }
      />

      <FilterToolbar
        activeCount={activeCount}
        onReset={reset}
        search={
          <SearchInput
            value={state.search}
            onChange={onSearch}
            placeholder="Search name, hospital, email…"
            label="Search doctors"
          />
        }
        end={<SortSelect value={state.sort} onChange={(sort) => setFilters({ sort })} />}
      >
        <FacetedFilter
          title="Specialization"
          options={(options.data?.specializations ?? []).map((value) => ({ value, label: value }))}
          selected={state.specialization}
          onChange={(specialization) => setFilters({ specialization })}
        />
        <Select
          value={state.hospital || ALL}
          onValueChange={(value) => setFilters({ hospital: value === ALL ? "" : value })}
        >
          <SelectTrigger className="h-9 max-w-56 bg-card" aria-label="Filter by hospital">
            <Building2 className="text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All hospitals</SelectItem>
            {options.data?.hospitals.map((hospital) => (
              <SelectItem key={hospital} value={hospital}>
                {hospital}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          title="Date added"
          from={state.from}
          to={state.to}
          onChange={(range) => setFilters(range)}
        />
      </FilterToolbar>

      {doctors.isError ? (
        <ErrorState error={doctors.error} onRetry={() => doctors.refetch()} />
      ) : (
        <>
          <DataTable
            caption="Doctors"
            columns={columns}
            rows={doctors.data?.data}
            getRowId={(doctor) => doctor.id}
            isLoading={doctors.isPending}
            isFetching={doctors.isPlaceholderData}
            renderMobileCard={(doctor) => (
              <DoctorCard
                doctor={doctor}
                canEdit={canEdit}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            )}
            empty={
              activeCount > 0 ? (
                <EmptyState
                  title="No doctors match your filters"
                  description="Try a different search or clear the filters."
                  action={
                    <Button variant="outline" onClick={reset}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<Stethoscope />}
                  title="No doctors yet"
                  description="Add your first doctor to start tracking patients."
                  action={
                    canEdit && (
                      <Button onClick={() => setFormOpen(true)}>
                        <Plus /> Add doctor
                      </Button>
                    )
                  }
                />
              )
            }
          />
          {doctors.data && doctors.data.meta.total > 0 && (
            <PaginationBar
              meta={doctors.data.meta}
              onPageChange={setPage}
              onLimitChange={setLimit}
              itemLabel="doctors"
            />
          )}
        </>
      )}

      <DoctorFormDialog open={formOpen} onOpenChange={setFormOpen} doctor={editing} />
      <DeleteDoctorDialog doctor={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}

function DoctorIdentity({ doctor }: { doctor: Doctor }) {
  return (
    <Link href={`/doctors/${doctor.id}`} className="group flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials(doctor.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:text-primary group-hover:underline">
          Dr. {doctor.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{doctor.email}</span>
      </span>
    </Link>
  );
}

type ActionProps = {
  doctor: Doctor;
  canEdit: boolean;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
};

function DoctorActions({ doctor, canEdit, onEdit, onDelete }: ActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for Dr. ${doctor.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/doctors/${doctor.id}`}>
            <Eye /> View patients
          </Link>
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem onSelect={() => onEdit(doctor)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(doctor)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DoctorCard(props: ActionProps) {
  const { doctor } = props;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <DoctorIdentity doctor={doctor} />
        <DoctorActions {...props} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Badge variant="secondary" className="font-normal">
          {doctor.specialization}
        </Badge>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <UsersRound className="size-3.5" />
          {formatNumber(doctor.patientCount)} patients
        </span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="size-3.5 shrink-0" />
        <span className="truncate">{doctor.hospital}</span>
      </p>
    </div>
  );
}
