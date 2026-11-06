export { cn } from "cn";

export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  if (value.startsWith("/login") || value.startsWith("/signout")) return fallback;
  return value;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

const numberFormat = new Intl.NumberFormat("en-US");
export const formatNumber = (value: number) => numberFormat.format(value);
