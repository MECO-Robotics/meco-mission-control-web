import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MemberPayload,
  MemberRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  TaskPayload,
  TaskRecord,
} from "./types";

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

async function requestApi<T>(
  path: string,
  options: RequestInit = {},
  onUnauthorized?: () => void,
) {
  const token = loadStoredSessionToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  try {
    return await readJson<T>(response);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      clearStoredSessionToken();
      onUnauthorized?.();
    }
    throw error;
  }
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

export async function fetchBootstrap(
  personId?: string | null,
  onUnauthorized?: () => void,
) {
  const query = personId ? `?personId=${encodeURIComponent(personId)}` : "";
  return requestApi<BootstrapPayload>(`/bootstrap${query}`, {}, onUnauthorized);
}

export async function createTask(
  payload: TaskPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskRecord }>(
    "/tasks",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: TaskRecord }>(
    `/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createMemberRecord(
  payload: MemberPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    "/members",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateMemberRecord(
  memberId: string,
  payload: Partial<MemberPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    `/members/${memberId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function deleteMemberRecord(
  memberId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MemberRecord }>(
    `/members/${memberId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPurchaseItemRecord(
  payload: PurchaseItemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PurchaseItemRecord }>(
    "/purchases",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updatePurchaseItemRecord(
  itemId: string,
  payload: Partial<PurchaseItemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PurchaseItemRecord }>(
    `/purchases/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createManufacturingItemRecord(
  payload: ManufacturingItemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ManufacturingItemRecord }>(
    "/manufacturing",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
}

export async function updateManufacturingItemRecord(
  itemId: string,
  payload: Partial<ManufacturingItemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: ManufacturingItemRecord }>(
    `/manufacturing/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );

  return response.item;
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
    if (error instanceof ApiError && error.statusCode === 401) {
      return false;
    }

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
