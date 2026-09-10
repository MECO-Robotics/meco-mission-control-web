import { getSessionCsrfToken } from "./sessionStorage";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function buildCookieRequestOptions(
  options: RequestInit = {},
  includeCsrf = true,
): RequestInit {
  const headers = new Headers(options.headers);
  const method = options.method?.toUpperCase() ?? "GET";
  const csrfToken = getSessionCsrfToken();

  if (includeCsrf && csrfToken && !SAFE_METHODS.has(method)) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  return {
    ...options,
    credentials: "include",
    headers,
  };
}
