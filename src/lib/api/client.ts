export type ApiErrorDetail = { path: string; message: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  fieldErrors(): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const detail of this.details) {
      const field = detail.path.replace(/^body\./, "");
      if (detail.path.startsWith("body.") && !fields[field]) fields[field] = detail.message;
    }
    return fields;
  }
}

export type QueryValue = string | number | boolean | null | undefined | string[];

export function toSearchParams(query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  let response: Response;
  try {
    response = await fetch(`/api/v1${path}${toSearchParams(query)}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Can't reach the server. Check your connection.");
  }

  if (response.status === 204) return undefined as T;

  const json = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: ApiErrorDetail[] };
  } | null;

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? "The server is unavailable right now. Please try again in a moment."
        : `Request failed (${response.status})`;
    throw new ApiError(
      response.status,
      json?.error?.code ?? "UNKNOWN_ERROR",
      json?.error?.message ?? fallback,
      json?.error?.details,
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    apiRequest<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: (path: string) => apiRequest<void>(path, { method: "DELETE" }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}
