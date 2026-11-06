import type { Metadata } from "next";
import { Suspense } from "react";
import { DoctorDetailPage } from "@/features/doctors/doctor-detail-page";

export const metadata: Metadata = { title: "Doctor" };

export default async function Page({ params }: PageProps<"/doctors/[id]">) {
  const { id } = await params;
  return (
    <Suspense>
      <DoctorDetailPage key={id} id={id} />
    </Suspense>
  );
}
