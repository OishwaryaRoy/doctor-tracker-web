"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-context";
import { PatientFormSheet } from "./patient-form-sheet";
import { PatientList } from "./patient-list";

export function PatientsPage() {
  const { canEdit } = useSession();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Patients"
        description="Every patient across all doctors. Search, filter and update records."
        actions={
          canEdit && (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus /> Add patient
            </Button>
          )
        }
      />
      <PatientList onAdd={() => setAddOpen(true)} />
      <PatientFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
