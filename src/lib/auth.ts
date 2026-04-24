import type {
  BootstrapPayload,
  ManufacturingItemPayload,
  ManufacturingItemRecord,
  MaterialPayload,
  MaterialRecord,
  MechanismPayload,
  MechanismRecord,
  MemberPayload,
  MemberRecord,
  PartDefinitionPayload,
  PartDefinitionRecord,
  PartInstancePayload,
  PartInstanceRecord,
  PurchaseItemPayload,
  PurchaseItemRecord,
  SubsystemPayload,
  SubsystemRecord,
  TaskPayload,
  TaskRecord,
  WorkLogPayload,
  WorkLogRecord,
} from "../types";

const DEFAULT_API_BASE_URL = "/api";
const SESSION_STORAGE_KEY = "meco.session.token";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export interface AuthConfig {
  enabled: boolean;
  googleClientId: string | null;
  hostedDomain: string;
  emailEnabled: boolean;
  devBypassAvailable: boolean;
}

export interface SessionUser {
  accountId: string;
  authProvider: "google" | "email";
  email: string;
  name: string;
  picture: string | null;
  hostedDomain: string;
}

export interface SessionResponse {
  token: string;
  user: SessionUser;
}

export interface EmailCodeDeliveryResponse {
  sentTo: string;
  expiresInMinutes: number;
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

type GoogleTrustedTypesPolicy = {
  createScriptURL: (value: string) => string;
};

type WindowWithGoogleTrustedTypesPolicy = Window & {
  trustedTypes?: {
    createPolicy: (
      name: string,
      rules: {
        createScriptURL: (value: string) => string;
      },
    ) => GoogleTrustedTypesPolicy;
  };
  __mecoGoogleTrustedTypesPolicy?: GoogleTrustedTypesPolicy;
};

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function readLocalGoogleClientIdOverride() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  if (!isLocalHostname(window.location.hostname)) {
    return null;
  }

  const override = import.meta.env.VITE_LOCAL_GOOGLE_CLIENT_ID?.trim();
  return override ? override : null;
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

function getGoogleTrustedTypesPolicy() {
  if (typeof window === "undefined") {
    return null;
  }

  const targetWindow = window as WindowWithGoogleTrustedTypesPolicy;
  if (!targetWindow.trustedTypes) {
    return null;
  }

  if (!targetWindow.__mecoGoogleTrustedTypesPolicy) {
    targetWindow.__mecoGoogleTrustedTypesPolicy = targetWindow.trustedTypes.createPolicy(
      "meco-web-google",
      {
        createScriptURL: (value: string) => value,
      },
    );
  }

  return targetWindow.__mecoGoogleTrustedTypesPolicy;
}

async function readJson<T>(response: Response): Promise<T> {
  const rawBody = await response.text().catch(() => "");
  let payload: { message?: string } | null = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as { message?: string };
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const statusText = response.statusText ? `: ${response.statusText}` : "";
    const textMessage = rawBody.trim();
    const fallbackMessage =
      payload?.message ??
      (textMessage.length > 0 ? textMessage : null) ??
      `Server Error (${response.status})${statusText}`;
    throw new ApiError(
      fallbackMessage,
      response.status,
    );
  }

  if (payload === null) {
    throw new ApiError(
      "The server returned an empty or invalid response.",
      502,
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

async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return readJson<T>(response);
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
    typeof candidate.hostedDomain === "string" &&
    typeof candidate.emailEnabled === "boolean" &&
    (candidate.devBypassAvailable === undefined ||
      typeof candidate.devBypassAvailable === "boolean")
  );
}

function normalizeBootstrapPayload(payload: BootstrapPayload): BootstrapPayload {
  const source = payload as Partial<BootstrapPayload>;

  return {
    members: source.members ?? [],
    subsystems: source.subsystems ?? [],
    disciplines: source.disciplines ?? [],
    mechanisms: source.mechanisms ?? [],
    requirements: source.requirements ?? [],
    materials: source.materials ?? [],
    partDefinitions: (source.partDefinitions ?? []).map((partDefinition) => ({
      ...partDefinition,
      materialId: partDefinition.materialId ?? null,
      description: partDefinition.description ?? "",
    })),
    partInstances: (source.partInstances ?? []).map((partInstance) => ({
      ...partInstance,
      mechanismId: partInstance.mechanismId ?? null,
      status: partInstance.status ?? "planned",
    })),
    events: source.events ?? [],
    tasks: source.tasks ?? [],
    workLogs: (source.workLogs ?? []).map((workLog) => ({
      ...workLog,
      participantIds: workLog.participantIds ?? [],
      notes: workLog.notes ?? "",
    })),
    purchaseItems: (source.purchaseItems ?? []).map((item) => ({
      ...item,
      partDefinitionId: item.partDefinitionId ?? null,
    })),
    manufacturingItems: (source.manufacturingItems ?? []).map((item) => ({
      ...item,
      materialId: item.materialId ?? null,
      partDefinitionId: item.partDefinitionId ?? null,
      partInstanceId: item.partInstanceId ?? null,
    })),
  };
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

  return {
    ...payload,
    devBypassAvailable: payload.devBypassAvailable ?? false,
  };
}

export function resolveGoogleClientId(config: AuthConfig | null) {
  if (!config?.enabled || !config.googleClientId) {
    return null;
  }

  return readLocalGoogleClientIdOverride() ?? config.googleClientId;
}

export function isUsingLocalGoogleClientIdOverride() {
  return readLocalGoogleClientIdOverride() !== null;
}

export function isLocalGoogleAuthHost() {
  return typeof window !== "undefined" && isLocalHostname(window.location.hostname);
}

export async function fetchBootstrap(
  personId?: string | null,
  onUnauthorized?: () => void,
) {
  const query = personId ? `?personId=${encodeURIComponent(personId)}` : "";
  const payload = await requestApi<BootstrapPayload>(
    `/bootstrap${query}`,
    {},
    onUnauthorized,
  );
  return normalizeBootstrapPayload(payload);
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

export async function createWorkLogRecord(
  payload: WorkLogPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: WorkLogRecord }>(
    "/work-logs",
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

export async function createSubsystemRecord(
  payload: SubsystemPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: SubsystemRecord }>(
    "/subsystems",
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

export async function updateSubsystemRecord(
  subsystemId: string,
  payload: Partial<SubsystemPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: SubsystemRecord }>(
    `/subsystems/${subsystemId}`,
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

export async function createMechanismRecord(
  payload: MechanismPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    "/mechanisms",
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

export async function updateMechanismRecord(
  mechanismId: string,
  payload: Partial<MechanismPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    `/mechanisms/${mechanismId}`,
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

export async function deleteMechanismRecord(
  mechanismId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MechanismRecord }>(
    `/mechanisms/${mechanismId}`,
    {
      method: "DELETE",
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

export async function createMaterialRecord(
  payload: MaterialPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    "/materials",
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

export async function updateMaterialRecord(
  materialId: string,
  payload: Partial<MaterialPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    `/materials/${materialId}`,
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

export async function deleteMaterialRecord(
  materialId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: MaterialRecord }>(
    `/materials/${materialId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPartDefinitionRecord(
  payload: PartDefinitionPayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    "/part-definitions",
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

export async function updatePartDefinitionRecord(
  partDefinitionId: string,
  payload: Partial<PartDefinitionPayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    `/part-definitions/${partDefinitionId}`,
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

export async function deletePartDefinitionRecord(
  partDefinitionId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartDefinitionRecord }>(
    `/part-definitions/${partDefinitionId}`,
    {
      method: "DELETE",
    },
    onUnauthorized,
  );

  return response.item;
}

export async function createPartInstanceRecord(
  payload: PartInstancePayload,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    "/part-instances",
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

export async function updatePartInstanceRecord(
  partInstanceId: string,
  payload: Partial<PartInstancePayload>,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    `/part-instances/${partInstanceId}`,
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

export async function deletePartInstanceRecord(
  partInstanceId: string,
  onUnauthorized?: () => void,
) {
  const response = await requestApi<{ item: PartInstanceRecord }>(
    `/part-instances/${partInstanceId}`,
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
  return postJson<SessionResponse>("/auth/google", { credential });
}

export async function requestEmailSignInCode(email: string) {
  return postJson<EmailCodeDeliveryResponse>("/auth/email/start", {
    email,
  });
}

export async function verifyEmailSignInCode(email: string, code: string) {
  return postJson<SessionResponse>("/auth/email/verify", {
    email,
    code,
  });
}

export async function requestDevBypassSignIn() {
  return postJson<SessionResponse>("/auth/dev-bypass", {});
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

    // If we can't verify the user (network error or server error), return false to be safe
    return false;
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
    const scriptUrl = "https://accounts.google.com/gsi/client";
    const trustedScriptUrl = getGoogleTrustedTypesPolicy()?.createScriptURL(scriptUrl);
    script.src = (trustedScriptUrl ?? scriptUrl) as string;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Clear the promise so subsequent attempts can retry loading the script
      googleScriptPromise = null;
      reject(new Error("Google Identity Services failed to load."));
    };
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}
