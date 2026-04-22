const DEFAULT_API_BASE_URL = "/api";
const SESSION_STORAGE_KEY = "meco.session.token";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export interface AuthConfig {
  enabled: boolean;
  googleClientId: string | null;
  hostedDomain: string;
}

export interface SessionUser {
  googleUserId: string;
  email: string;
  name: string;
  picture: string | null;
  hostedDomain: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface GoogleCredentialResponse {
  credential?: string;
}

class ApiError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload as T;
}

function isAuthConfig(payload: unknown): payload is AuthConfig {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.enabled === "boolean" &&
    (typeof candidate.googleClientId === "string" ||
      candidate.googleClientId === null) &&
    typeof candidate.hostedDomain === "string"
  );
}

export async function fetchAuthConfig() {
  const response = await fetch(buildApiUrl("/auth/config"));
  const payload = await readJson<unknown>(response);

  if (!isAuthConfig(payload)) {
    throw new ApiError(
      "The server returned an invalid authentication configuration.",
      502,
    );
  }

  return payload;
}

export async function exchangeGoogleCredential(credential: string) {
  const response = await fetch(buildApiUrl("/auth/google"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  return readJson<SessionResponse>(response);
}

export async function fetchCurrentUser(token: string) {
  const response = await fetch(buildApiUrl("/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await readJson<{
    enabled: boolean;
    user: SessionUser | null;
  }>(response);

  if (!payload.user) {
    throw new ApiError("No signed-in session is available.", 401);
  }

  return payload.user;
}

export async function makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit = {},
  onUnauthorized?: () => void,
): Promise<T> {
  const token = loadStoredSessionToken();
  if (!token) {
    throw new ApiError("No session token available.", 401);
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    return await readJson<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      // Token is invalid/expired, clear it
      clearStoredSessionToken();
      onUnauthorized?.();
    }
    throw error;
  }
}

export function loadStoredSessionToken() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function storeSessionToken(token: string) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearStoredSessionToken() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function signOutFromGoogle() {
  if (window.google?.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
    // Note: Google Identity Services doesn't have a direct signOut method
    // The user will remain signed in to Google, but auto-select is disabled
  }
}

export async function validateSession(): Promise<boolean> {
  try {
    const token = loadStoredSessionToken();
    if (!token) {
      return false;
    }

    await fetchCurrentUser(token);
    return true;
  } catch (error) {
    // If it's a 401, token is invalid
    if (error instanceof ApiError && error.statusCode === 401) {
      return false;
    }
    // For other errors (network, server issues), assume session is still valid
    // to avoid signing out users due to temporary issues
    return true;
  }
}

export function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Identity Services failed to load."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}
