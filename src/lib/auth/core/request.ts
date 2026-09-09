import { getLocalWorkspaceGeneration, getLocalWorkspaceMode, localMediaUrl, requestLocalWorkspace, shouldHandleLocally } from "@/lib/localWorkspace/session";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MediaUploadResponse, SessionUser } from "../types";
import { getSessionGeneration } from "./sessionStorage";
import { buildCookieRequestOptions } from "./requestOptions";

const DEFAULT_API_BASE_URL = "/api";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
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
    throw new ApiError(fallbackMessage, response.status);
  }

  if (payload === null) {
    throw new ApiError(
      "The server returned an empty or invalid response.",
      502,
    );
  }

  return payload as T;
}

export function isApiErrorLike(
  error: unknown,
): error is { statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  );
}

export function requestApi<T>(
  path: string,
  options: RequestInit = {},
  onUnauthorized?: () => void,
) {
  if (shouldHandleLocally(path)) {
    return requestLocalWorkspace<T>(path, options, () =>
      fetch(buildApiUrl("/bootstrap?seasonId=default-season"), { credentials: "omit" })
        .then((response) => readJson<BootstrapPayload>(response)),
    );
  }
  const generation = getSessionGeneration();
  const workspaceGeneration = getLocalWorkspaceGeneration();
  const assertCurrentWorkspace = () => {
    if (!path.startsWith("/auth/") && workspaceGeneration !== getLocalWorkspaceGeneration()) {
      throw Object.assign(new Error("The workspace changed while this request was pending."), { name: "AbortError" });
    }
  };
  return fetch(buildApiUrl(path), buildCookieRequestOptions(options))
    .then((response) => readJson<T>(response))
    .then((payload) => { assertCurrentWorkspace(); return payload; })
    .catch((error) => {
      assertCurrentWorkspace();
      if (error instanceof ApiError && error.statusCode === 401 && generation === getSessionGeneration()) {
        onUnauthorized?.();
      }
      throw error;
    });
}

export function postJson<T>(path: string, body: unknown) {
  if (shouldHandleLocally(path)) return requestApi<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return fetch(
    buildApiUrl(path),
    buildCookieRequestOptions(
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      false,
    ),
  ).then((response) => readJson<T>(response));
}

export async function requestUpload(
  endpoint: string,
  failureMessage: string,
  projectId: string,
  file: File,
  onUnauthorized?: () => void,
) {
  if (getLocalWorkspaceMode()) return localMediaUrl(file);
  const presignedUpload = await requestApi<MediaUploadResponse>(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    },
    onUnauthorized,
  );

  const uploadResponse = await fetch(presignedUpload.uploadUrl, {
    method: presignedUpload.method,
    headers: presignedUpload.headers,
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new ApiError(failureMessage, uploadResponse.status);
  }

  return presignedUpload.publicUrl;
}

export async function fetchWebSession() {
  const payload = await requestApi<{
    csrfToken: string;
    expiresAt: string;
    user: SessionUser | null;
  }>("/auth/web/session");

  if (!payload.user) {
    throw new ApiError("No signed-in session is available.", 401);
  }

  return payload;
}
