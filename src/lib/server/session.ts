import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@/lib/api/types";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const getSessionUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Session check failed (${response.status})`);

  const json = (await response.json()) as { data: { user: User } };
  return json.data.user;
});
