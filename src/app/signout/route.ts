import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { safeRedirectPath } from "@/lib/utils";

export function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("expired", "1");
  if (next !== "/dashboard") loginUrl.searchParams.set("next", next);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
