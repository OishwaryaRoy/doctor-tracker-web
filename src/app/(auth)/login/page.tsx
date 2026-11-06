import { Activity, ShieldCheck, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand } from "@/components/layout/brand";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  { icon: Stethoscope, text: "Doctors and their patients in one place" },
  { icon: Activity, text: "Live caseload analytics and trends" },
  { icon: ShieldCheck, text: "Role-based access for your team" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(60rem_40rem_at_10%_-10%,white,transparent_60%),radial-gradient(40rem_30rem_at_110%_110%,white,transparent_60%)]"
        />
        <Brand className="relative [&_span.text-muted-foreground]:text-primary-foreground/70 [&>span:first-child]:bg-primary-foreground [&>span:first-child]:text-primary" />
        <div className="relative max-w-md space-y-6">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
            Every doctor, every patient, one clear view.
          </h1>
          <ul className="space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Authorized staff only. Activity may be monitored.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm space-y-8">
          <Brand className="lg:hidden" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use your staff account to access the portal.
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
