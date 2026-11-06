"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { safeRedirectPath } from "@/lib/utils";
import { useLogin } from "./api";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@doctortracker.test", password: "Admin@12345" },
  { label: "Viewer", email: "viewer@doctortracker.test", password: "Viewer@12345" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const sessionExpired = searchParams.get("expired") === "1";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!login.isPending) return;
    const timer = setTimeout(() => setSlowServer(true), 4000);
    return () => {
      clearTimeout(timer);
      setSlowServer(false);
    };
  }, [login.isPending]);

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        router.replace(safeRedirectPath(searchParams.get("next")));
        router.refresh();
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          for (const [field, message] of Object.entries(error.fieldErrors())) {
            form.setError(field as keyof LoginValues, { message });
          }
        }
      },
    });
  });

  const formError = login.error && !(login.error instanceof ApiError && login.error.status === 400);

  return (
    <div className="space-y-6">
      {sessionExpired && !login.error && (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Your session ended. Please sign in again.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {errorMessage(login.error)}
            </p>
          )}

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  placeholder="you@hospital.org"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Button type="submit" size="lg" disabled={login.isPending} className="w-full">
            {login.isPending && <Spinner />}
            {login.isPending ? "Signing in…" : "Sign in"}
          </Button>
          {slowServer && (
            <p className="text-center text-xs text-muted-foreground" aria-live="polite">
              Waking up the server — this can take a few seconds on first visit.
            </p>
          )}
        </FieldGroup>
      </form>

      {SHOW_DEMO_ACCOUNTS && (
        <div className="rounded-xl border border-dashed p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Demo accounts
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.reset({ email: account.email, password: account.password });
                  login.reset();
                }}
              >
                Use {account.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Admins can edit everything; viewers have read-only access.
          </p>
        </div>
      )}
    </div>
  );
}
