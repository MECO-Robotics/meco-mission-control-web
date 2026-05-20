import { requestApi } from "@/lib/auth/core/request";
import type {
  CadGraphImportResult,
  OnshapeDocumentRefRecord,
  OnshapeOverview,
  OnshapeSyncEstimate,
  SyncLevel,
} from "../model/cadIntegrationTypes";

export function fetchOnshapeOverview(onUnauthorized?: () => void) {
  return requestApi<OnshapeOverview>("/onshape/overview", {}, onUnauthorized);
}

export function createOnshapeOAuthAuthorizationUrl(onUnauthorized?: () => void) {
  return requestApi<{
    authorizationUrl: string;
    state: string;
  }>(
    "/onshape/oauth/authorization-url",
    { method: "POST" },
    onUnauthorized,
  );
}

export function refreshOnshapeOAuth(onUnauthorized?: () => void) {
  return requestApi<{
    item: {
      connected: boolean;
      tokenExpiresAt: string | null;
    };
  }>(
    "/onshape/oauth/refresh",
    { method: "POST" },
    onUnauthorized,
  );
}

export function createOnshapeDocumentRef(
  payload: {
    url: string;
    label?: string;
    projectId?: string | null;
    seasonId?: string | null;
  },
  onUnauthorized?: () => void,
) {
  return requestApi<{
    item: OnshapeDocumentRefRecord;
    warnings: string[];
  }>(
    "/onshape/document-refs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

export function fetchOnshapeImportEstimate(
  payload: {
    documentRefId: string;
    syncLevel: SyncLevel;
  },
  onUnauthorized?: () => void,
) {
  const params = new URLSearchParams({
    documentRefId: payload.documentRefId,
    syncLevel: payload.syncLevel,
  });
  return requestApi<{ item: OnshapeSyncEstimate }>(
    `/onshape/import-estimate?${params.toString()}`,
    {},
    onUnauthorized,
  );
}

export function runOnshapeImport(
  payload: {
    documentRefId: string;
    syncLevel: SyncLevel;
  },
  onUnauthorized?: () => void,
) {
  return requestApi<{ result: CadGraphImportResult }>(
    "/onshape/import-runs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}
