"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session-context";
import { PatientFormSheet } from "@/features/patients/patient-form-sheet";
import { PatientList } from "@/features/patients/patient-list";
import { ApiError } from "@/lib/api/client";
import type { DoctorDetail, PatientCondition } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { CONDITION_META, CONDITION_ORDER } from "@/lib/labels";
import { cn, formatNumber, initials } from "@/lib/utils";
import { useDoctor } from "./api";
import { DeleteDoctorDialog } from "./delete-doctor-dialog";
import { DoctorFormDialog } from "./doctor-form-dialog";

export function DoctorDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { canEdit } = useSession();
  const doctor = useDoctor(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const back = (
    <Link
      href="/doctors"
      className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Doctors
    </Link>
  );

  if (doctor.isError) {
    const notFound = doctor.error instanceof ApiError && [400, 404].includes(doctor.error.status);
    return (
      <>
        {back}
        <ErrorState
          title={notFound ? "Doctor not found" : "Couldn't load this doctor"}
          error={
            notFound
              ? new ApiError(404, "NOT_FOUND", "This doctor may have been deleted.")
              : doctor.error
          }
          onRetry={notFound ? undefined : () => doctor.refetch()}
        />
      </>
    );
  }

  const data = doctor.data;

  return (
    <>
      <PageHeader
        title={
          data ? (
            <span className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {initials(data.name)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate">Dr. {data.name}</span>
              </span>
            </span>
          ) : (
            <Skeleton className="h-11 w-64" />
          )
        }
        description={
          data ? (
            <Badge variant="secondary" className="mt-1 font-normal">
              {data.specialization}
            </Badge>
          ) : undefined
        }
        actions={
          canEdit &&
          data && (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 /> Delete
              </Button>
            </>
          )
        }
      >
        {back}
      </PageHeader>

      <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ContactCard doctor={data} />
        <CaseloadCard doctor={data} />
      </div>

      <section aria-labelledby="patients-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="patients-heading" className="text-lg font-semibold tracking-tight">
              Patients
            </h2>
            <p className="text-sm text-muted-foreground">
              Everyone currently under this doctor&apos;s care.
            </p>
          </div>
          {canEdit && data && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus /> Add patient
            </Button>
          )}
        </div>
        {data && <PatientList doctor={data} onAdd={() => setAddOpen(true)} />}
      </section>

      {data && (
        <>
          <DoctorFormDialog open={editOpen} onOpenChange={setEditOpen} doctor={data} />
          <DeleteDoctorDialog
            doctor={deleteOpen ? data : null}
            onOpenChange={setDeleteOpen}
            onDeleted={() => router.replace("/doctors")}
          />
          <PatientFormSheet open={addOpen} onOpenChange={setAddOpen} doctor={data} />
        </>
      )}
    </>
  );
}

function ContactCard({ doctor }: { doctor?: DoctorDetail }) {
  const rows = doctor
    ? [
        { icon: Building2, label: "Hospital", value: doctor.hospital },
        {
          icon: Mail,
          label: "Email",
          value: (
            <a href={`mailto:${doctor.email}`} className="hover:text-primary hover:underline">
              {doctor.email}
            </a>
          ),
        },
        {
          icon: Phone,
          label: "Phone",
          value: (
            <a
              href={`tel:${doctor.phone.replace(/[^\d+]/g, "")}`}
              className="tabular hover:text-primary hover:underline"
            >
              {doctor.phone}
            </a>
          ),
        },
        { icon: CalendarDays, label: "Added", value: formatDate(doctor.createdAt) },
      ]
    : [];

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Contact</CardTitle>
      </CardHeader>
      <CardContent>
        {doctor ? (
          <dl className="space-y-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <dt className="sr-only">{label}</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-3/4" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CaseloadCard({ doctor }: { doctor?: DoctorDetail }) {
  const total = doctor?.patientCount ?? 0;
  const entries: [PatientCondition, number][] = doctor
    ? CONDITION_ORDER.map((condition) => [condition, doctor.patientsByCondition[condition] ?? 0])
    : [];

  return (
    <Card className="gap-4">
      <CardHeader className="flex-row items-baseline justify-between">
        <CardTitle className="text-base">Caseload</CardTitle>
        {doctor ? (
          <span className="text-sm text-muted-foreground">
            <span className="tabular text-2xl font-semibold text-foreground">
              {formatNumber(total)}
            </span>{" "}
            patients
          </span>
        ) : (
          <Skeleton className="h-7 w-24" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label={
            entries.map(([c, n]) => `${CONDITION_META[c].label}: ${n}`).join(", ") || "Loading"
          }
        >
          {total > 0 &&
            entries.map(([condition, count]) =>
              count > 0 ? (
                <span
                  key={condition}
                  className={cn("h-full", CONDITION_META[condition].dot)}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              ) : null,
            )}
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {doctor
            ? entries.map(([condition, count]) => (
                <li key={condition} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-full", CONDITION_META[condition].dot)}
                      aria-hidden
                    />
                    {CONDITION_META[condition].label}
                  </span>
                  <span className="tabular font-medium">{count}</span>
                </li>
              ))
            : Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-4" />)}
        </ul>
      </CardContent>
    </Card>
  );
}
