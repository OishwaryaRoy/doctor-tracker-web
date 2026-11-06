"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { DoctorPicker } from "@/features/doctors/doctor-picker";
import { useOptions } from "@/features/meta/api";
import { ApiError, errorMessage } from "@/lib/api/client";
import type { DoctorOption, Gender, Patient, PatientCondition } from "@/lib/api/types";
import { localDayToIso, toLocalDayInput, utcDay } from "@/lib/format";
import { CONDITION_META, GENDER_LABELS } from "@/lib/labels";
import { useCreatePatient, useUpdatePatient, type PatientInput } from "./api";

const NONE = "__none";
const today = () => format(new Date(), "yyyy-MM-dd");

const patientSchema = z.object({
  name: z.string().trim().min(2, "Must be at least 2 characters").max(100),
  email: z.union([z.literal(""), z.string().trim().pipe(z.email("Enter a valid email address"))]),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number"),
  gender: z.string().min(1, "Choose a gender"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => value <= today(), "Date of birth can't be in the future")
    .refine((value) => value >= "1900-01-01", "Enter a realistic date of birth"),
  bloodGroup: z.string(),
  condition: z.string().min(1, "Choose a condition"),
  diagnosis: z.string().trim().min(2, "Must be at least 2 characters").max(200),
  admissionDate: z
    .string()
    .min(1, "Admission date is required")
    .refine((value) => value <= today(), "Admission date can't be in the future"),
  notes: z.string().max(2000),
  doctor: z
    .custom<DoctorOption | null>()
    .refine((value): boolean => value !== null, "Choose a doctor"),
});

type PatientValues = z.infer<typeof patientSchema>;

function defaults(patient?: Patient, doctor?: DoctorOption): PatientValues {
  return {
    name: patient?.name ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    gender: patient?.gender ?? "",
    dateOfBirth: patient ? utcDay(patient.dateOfBirth) : "",
    bloodGroup: patient?.bloodGroup ?? "",
    condition: patient?.condition ?? "under_observation",
    diagnosis: patient?.diagnosis ?? "",
    admissionDate: patient ? toLocalDayInput(patient.admissionDate) : today(),
    notes: patient?.notes ?? "",
    doctor: patient?.doctor ?? doctor ?? null,
  };
}

function toInput(values: PatientValues): PatientInput {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone,
    gender: values.gender as Gender,
    dateOfBirth: values.dateOfBirth,
    bloodGroup: values.bloodGroup || null,
    condition: values.condition as PatientCondition,
    diagnosis: values.diagnosis,
    admissionDate: localDayToIso(values.admissionDate),
    notes: values.notes || null,
    doctor: values.doctor!.id,
  };
}

export function PatientFormSheet({
  open,
  onOpenChange,
  patient,
  doctor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  doctor?: DoctorOption;
}) {
  const isEdit = Boolean(patient);
  const options = useOptions();
  const create = useCreatePatient();
  const update = useUpdatePatient();
  const isPending = create.isPending || update.isPending;

  const form = useForm<PatientValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: defaults(patient, doctor),
  });

  useEffect(() => {
    if (open) form.reset(defaults(patient, doctor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient, doctor]);

  const onSubmit = form.handleSubmit(async (values) => {
    const input = toInput(values);
    try {
      if (isEdit) {
        const dirty = form.formState.dirtyFields;
        const changed = Object.fromEntries(
          Object.entries(input).filter(([key]) => dirty[key as keyof PatientValues]),
        );
        if (Object.keys(changed).length === 0) return onOpenChange(false);
        await update.mutateAsync({ id: patient!.id, input: changed });
      } else {
        await create.mutateAsync(input);
      }
      toast.success(isEdit ? "Patient updated" : "Patient added", { description: values.name });
      onOpenChange(false);
    } catch (error) {
      const fields = error instanceof ApiError ? error.fieldErrors() : {};
      if (Object.keys(fields).length > 0) {
        for (const [field, message] of Object.entries(fields)) {
          form.setError(field as keyof PatientValues, { message }, { shouldFocus: true });
        }
      } else {
        toast.error(isEdit ? "Couldn't update patient" : "Couldn't add patient", {
          description: errorMessage(error),
        });
      }
    }
  });

  return (
    <Sheet open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>{isEdit ? "Edit patient" : "Add patient"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the patient's details, condition or assigned doctor."
              : doctor
                ? `New patient under Dr. ${doctor.name}.`
                : "Register a new patient and assign them to a doctor."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="patient-form"
          onSubmit={onSubmit}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <FieldGroup className="gap-6">
            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Personal details
              </FieldLegend>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="patient-name">Full name</FieldLabel>
                    <Input {...field} id="patient-name" aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-gender">Gender</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="patient-gender"
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {(options.data?.genders ?? []).map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {GENDER_LABELS[gender]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-dob">Date of birth</FieldLabel>
                      <Input
                        {...field}
                        id="patient-dob"
                        type="date"
                        max={today()}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="phone"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-phone">Phone</FieldLabel>
                      <Input
                        {...field}
                        id="patient-phone"
                        type="tel"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-email">
                        Email <span className="font-normal text-muted-foreground">(optional)</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="patient-email"
                        type="email"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label" className="text-muted-foreground">
                Care
              </FieldLegend>
              <Controller
                control={form.control}
                name="doctor"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="patient-doctor">Doctor</FieldLabel>
                    {doctor && !isEdit ? (
                      <Input id="patient-doctor" value={`Dr. ${doctor.name}`} disabled readOnly />
                    ) : (
                      <DoctorPicker
                        id="patient-doctor"
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        invalid={fieldState.invalid}
                      />
                    )}
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="diagnosis"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="patient-diagnosis">Diagnosis</FieldLabel>
                    <Input {...field} id="patient-diagnosis" aria-invalid={fieldState.invalid} />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Controller
                  control={form.control}
                  name="condition"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-1">
                      <FieldLabel htmlFor="patient-condition">Condition</FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="patient-condition"
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(options.data?.conditions ?? []).map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              <span
                                className={`size-2 rounded-full ${CONDITION_META[condition].dot}`}
                              />
                              {CONDITION_META[condition].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="patient-blood">Blood group</FieldLabel>
                      <Select
                        value={field.value || NONE}
                        onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                      >
                        <SelectTrigger id="patient-blood" ref={field.ref} className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Unknown</SelectItem>
                          {(options.data?.bloodGroups ?? []).map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="admissionDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="patient-admission">Admitted</FieldLabel>
                      <Input
                        {...field}
                        id="patient-admission"
                        type="date"
                        max={today()}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
              <Controller
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="patient-notes">
                      Notes <span className="font-normal text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="patient-notes"
                      rows={3}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldSet>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" disabled={isPending}>
            {isPending && <Spinner />}
            {isEdit ? "Save changes" : "Add patient"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
