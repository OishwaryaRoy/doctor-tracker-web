"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useOptions } from "@/features/meta/api";
import { ApiError, errorMessage } from "@/lib/api/client";
import type { Doctor } from "@/lib/api/types";
import { useCreateDoctor, useUpdateDoctor, type DoctorInput } from "./api";

const doctorSchema = z.object({
  name: z.string().trim().min(2, "Must be at least 2 characters").max(100),
  specialization: z.string().min(1, "Choose a specialization"),
  hospital: z.string().trim().min(2, "Must be at least 2 characters").max(150),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
});

type DoctorValues = z.infer<typeof doctorSchema>;

const EMPTY: DoctorValues = { name: "", specialization: "", hospital: "", phone: "", email: "" };

export function DoctorFormDialog({
  open,
  onOpenChange,
  doctor,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor;
  onCreated?: (doctor: Doctor) => void;
}) {
  const isEdit = Boolean(doctor);
  const options = useOptions();
  const create = useCreateDoctor();
  const update = useUpdateDoctor(doctor?.id ?? "");
  const mutation = isEdit ? update : create;

  const form = useForm<DoctorValues>({ resolver: zodResolver(doctorSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    form.reset(
      doctor
        ? {
            name: doctor.name,
            specialization: doctor.specialization,
            hospital: doctor.hospital,
            phone: doctor.phone,
            email: doctor.email,
          }
        : EMPTY,
    );
    create.reset();
    update.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctor]);

  const onSubmit = form.handleSubmit(async (values: DoctorInput) => {
    try {
      const input = isEdit
        ? Object.fromEntries(
            Object.entries(values).filter(
              ([key]) => form.getFieldState(key as keyof DoctorValues).isDirty,
            ),
          )
        : values;
      if (isEdit && Object.keys(input).length === 0) return onOpenChange(false);

      const { data } = isEdit ? await update.mutateAsync(input) : await create.mutateAsync(values);
      toast.success(isEdit ? "Doctor updated" : "Doctor added", { description: data.name });
      onOpenChange(false);
      if (!isEdit) onCreated?.(data);
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors()).length > 0) {
        for (const [field, message] of Object.entries(error.fieldErrors())) {
          form.setError(field as keyof DoctorValues, { message }, { shouldFocus: true });
        }
      } else {
        toast.error(isEdit ? "Couldn't update doctor" : "Couldn't add doctor", {
          description: errorMessage(error),
        });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this doctor's profile and contact details."
              : "Add a doctor so you can start assigning patients to them."}
          </DialogDescription>
        </DialogHeader>

        <form id="doctor-form" onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="doctor-name">Full name</FieldLabel>
                  <Input
                    {...field}
                    id="doctor-name"
                    placeholder="e.g. Sarah Chen"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="specialization"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="doctor-specialization">Specialization</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="doctor-specialization"
                        ref={field.ref}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.data?.specializations.map((specialization) => (
                          <SelectItem key={specialization} value={specialization}>
                            {specialization}
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
                name="hospital"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="doctor-hospital">Hospital</FieldLabel>
                    <Input
                      {...field}
                      id="doctor-hospital"
                      list="hospital-suggestions"
                      autoComplete="off"
                      placeholder="Hospital or clinic"
                      aria-invalid={fieldState.invalid}
                    />
                    <datalist id="hospital-suggestions">
                      {options.data?.hospitals.map((hospital) => (
                        <option key={hospital} value={hospital} />
                      ))}
                    </datalist>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="doctor-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="doctor-email"
                      type="email"
                      autoComplete="off"
                      placeholder="name@hospital.org"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="doctor-phone">Phone</FieldLabel>
                    <Input
                      {...field}
                      id="doctor-phone"
                      type="tel"
                      autoComplete="off"
                      placeholder="+1 555 010 0000"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            {isEdit ? "Save changes" : "Add doctor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
