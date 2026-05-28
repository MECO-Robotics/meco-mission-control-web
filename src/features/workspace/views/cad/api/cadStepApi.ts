import { requestApi } from "@/lib/auth/core/request";
import type {
  CadHierarchyReview,
  CadHierarchyReviewDecision,
  CadPartMatchProposal,
  CadStepDiff,
  CadStepImportRunRecord,
  CadStepImportSummary,
  CadStepMappingRecord,
  CadStepSnapshotRecord,
  CadStepTreeNode,
  CadStepWarningRecord,
} from "../model/cadIntegrationTypes";

export function uploadCadStepFile(
  payload: {
    file: File;
    label: string;
    projectId?: string | null;
    seasonId?: string | null;
  },
  onUnauthorized?: () => void,
) {
  const formData = new FormData();
  formData.set("label", payload.label);
  if (payload.projectId) {
    formData.set("projectId", payload.projectId);
  }
  if (payload.seasonId) {
    formData.set("seasonId", payload.seasonId);
  }
  formData.set("file", payload.file);
  return requestApi<{
    importRun: CadStepImportRunRecord;
    snapshot: CadStepSnapshotRecord;
    summary: CadStepImportSummary;
  }>("/cad/step-imports", { method: "POST", body: formData }, onUnauthorized);
}

export function fetchCadSnapshots(
  payload: { projectId?: string | null; seasonId?: string | null } = {},
  onUnauthorized?: () => void,
) {
  const params = new URLSearchParams();
  if (payload.projectId) {
    params.set("projectId", payload.projectId);
  }
  if (payload.seasonId) {
    params.set("seasonId", payload.seasonId);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestApi<{ items: CadStepSnapshotRecord[] }>(`/cad/snapshots${suffix}`, {}, onUnauthorized);
}

export function fetchCadStepImportRuns(
  payload: { projectId?: string | null; seasonId?: string | null } = {},
  onUnauthorized?: () => void,
) {
  const params = new URLSearchParams();
  if (payload.projectId) {
    params.set("projectId", payload.projectId);
  }
  if (payload.seasonId) {
    params.set("seasonId", payload.seasonId);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return requestApi<{ items: CadStepImportRunRecord[] }>(`/cad/import-runs${suffix}`, {}, onUnauthorized);
}

export function fetchCadSnapshotSummary(snapshotId: string, onUnauthorized?: () => void) {
  return requestApi<{ item: CadStepSnapshotRecord; summary: CadStepImportSummary }>(
    `/cad/snapshots/${snapshotId}`,
    {},
    onUnauthorized,
  );
}

function groupInstancesSuffix(options?: { groupInstances?: boolean }) {
  return options?.groupInstances === undefined ? "" : `?groupInstances=${String(options.groupInstances)}`;
}

export function fetchCadSnapshotTree(
  snapshotId: string,
  options?: { groupInstances?: boolean },
  onUnauthorized?: () => void,
) {
  return requestApi<{ snapshotId: string; rootNodes: CadStepTreeNode[] }>(
    `/cad/snapshots/${snapshotId}/tree${groupInstancesSuffix(options)}`,
    {},
    onUnauthorized,
  );
}

export function fetchCadSnapshotMappings(
  snapshotId: string,
  options?: { groupInstances?: boolean },
  onUnauthorized?: () => void,
) {
  return requestApi<{ items: CadStepMappingRecord[] }>(
    `/cad/snapshots/${snapshotId}/mappings${groupInstancesSuffix(options)}`,
    {},
    onUnauthorized,
  );
}

export function fetchCadHierarchyReview(snapshotId: string, onUnauthorized?: () => void) {
  return requestApi<CadHierarchyReview>(
    `/cad/snapshots/${snapshotId}/hierarchy-review`,
    {},
    onUnauthorized,
  );
}

export function applyCadHierarchyReview(
  snapshotId: string,
  payload: { decisions: CadHierarchyReviewDecision[] },
  onUnauthorized?: () => void,
) {
  return requestApi<{ applied?: CadHierarchyReviewDecision[]; decisions?: CadHierarchyReviewDecision[] }>(
    `/cad/snapshots/${snapshotId}/hierarchy-review/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

export function fetchCadPartMatchProposals(snapshotId: string, onUnauthorized?: () => void) {
  return requestApi<{ snapshotId: string; items: CadPartMatchProposal[] }>(
    `/cad/snapshots/${snapshotId}/part-match-proposals`,
    {},
    onUnauthorized,
  );
}

export function applyCadSnapshotMappings(
  snapshotId: string,
  payload: {
    updates: Array<{
      mappingId?: string;
      sourceKind?: CadStepMappingRecord["sourceKind"];
      sourceIds?: string[];
      targetKind: CadStepMappingRecord["targetKind"];
      targetId?: string | null;
      confidence?: CadStepMappingRecord["confidence"];
      status?: CadStepMappingRecord["status"];
      applyToFuture?: boolean;
    }>;
  },
  onUnauthorized?: () => void,
) {
  return requestApi<{ updated: CadStepMappingRecord[]; mappingRules: unknown[] }>(
    `/cad/snapshots/${snapshotId}/mappings/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

export function finalizeCadSnapshot(
  snapshotId: string,
  payload: { allowUnresolved?: boolean } = {},
  onUnauthorized?: () => void,
) {
  return requestApi<{ item: CadStepSnapshotRecord }>(
    `/cad/snapshots/${snapshotId}/finalize`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    onUnauthorized,
  );
}

export function fetchCadSnapshotDiff(snapshotId: string, onUnauthorized?: () => void) {
  return requestApi<CadStepDiff>(`/cad/snapshots/${snapshotId}/diff`, {}, onUnauthorized);
}

export type { CadStepWarningRecord };
