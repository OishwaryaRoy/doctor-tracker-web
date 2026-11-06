"use client";

import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { errorMessage } from "@/lib/api/client";
import type { Doctor } from "@/lib/api/types";
import { useDeleteDoctor } from "./api";

export function DeleteDoctorDialog({
  doctor,
  onOpenChange,
  onDeleted,
}: {
  doctor: Pick<Doctor, "id" | "name" | "patientCount"> | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteDoctor();
  const hasPatients = (doctor?.patientCount ?? 0) > 0;

  return (
    <ConfirmDialog
      open={doctor !== null}
      onOpenChange={onOpenChange}
      title={`Delete ${doctor?.name ?? "doctor"}?`}
      description={
        hasPatients
          ? `This doctor still has ${doctor?.patientCount} patient(s). Reassign or remove them first — the server will refuse to delete a doctor with patients.`
          : "This permanently removes the doctor. This can't be undone."
      }
      pending={remove.isPending}
      onConfirm={() =>
        doctor &&
        remove.mutate(doctor.id, {
          onSuccess: () => {
            toast.success("Doctor deleted", { description: doctor.name });
            onOpenChange(false);
            onDeleted?.();
          },
          onError: (error) =>
            toast.error("Couldn't delete doctor", { description: errorMessage(error) }),
        })
      }
    />
  );
}
