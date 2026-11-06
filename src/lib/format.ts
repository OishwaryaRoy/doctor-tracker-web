import { format, formatDistanceToNowStrict } from "date-fns";

export function formatDate(iso: string, pattern = "MMM d, yyyy") {
  return format(new Date(iso), pattern);
}

export function formatRelative(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function utcDay(iso: string) {
  return iso.slice(0, 10);
}

export function formatCalendarDate(iso: string, pattern = "MMM d, yyyy") {
  const [y, m, d] = utcDay(iso).split("-").map(Number);
  return format(new Date(y!, m! - 1, d!), pattern);
}

export function toLocalDayInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}

export function localDayToIso(day: string) {
  return new Date(`${day}T12:00:00`).toISOString();
}
