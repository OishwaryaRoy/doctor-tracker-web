export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "dt_session";

export function isTokenUnexpired(token: string | undefined): boolean {
  if (!token) return false;
  const payload = token.split(".")[1];
  if (!payload) return false;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof json.exp === "number" && json.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
