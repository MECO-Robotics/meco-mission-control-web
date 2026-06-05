import type { CadSnapshotRecord, OnshapeOverview } from "../../model/cadIntegrationTypes";

export function createOverview(overrides: Partial<OnshapeOverview> = {}): OnshapeOverview {
  return {
    connection: {
      authMode: "oauth",
      baseUrl: "https://cad.onshape.com",
      configured: true,
      credentialReference: "onshape-oauth",
      lastError: null,
    },
    documentRefs: [],
    importRuns: [],
    syncJobs: [],
    snapshots: [],
    latestSnapshot: null,
    assemblyNodes: [],
    partDefinitions: [],
    partInstances: [],
    warnings: [],
    budget: {
      planType: "education",
      dailySoftBudget: 100,
      perSyncSoftBudget: 25,
      callsUsedToday: 0,
      callsUsedThisMonth: 0,
      callsUsedThisYear: 0,
      warningThresholdPercent: 70,
      hardStopThresholdPercent: 90,
      lastRateLimitRemaining: null,
    },
    ...overrides,
  };
}

export function createSnapshotPair() {
  const previousSnapshot: CadSnapshotRecord = {
    id: "snapshot-previous",
    label: "May 2026 release",
    onshapeDocumentRefId: "ref-1",
    importRunId: "run-previous",
    source: "onshape",
    documentId: "doc-1",
    workspaceId: null,
    versionId: "version-1",
    microversionId: null,
    elementId: "element-1",
    immutable: true,
    createdAt: "2026-05-01T12:00:00.000Z",
    previousSnapshotId: null,
  };
  const currentSnapshot: CadSnapshotRecord = {
    ...previousSnapshot,
    id: "snapshot-current",
    label: "June 2026 release",
    importRunId: "run-current",
    versionId: "version-2",
    createdAt: "2026-06-01T12:00:00.000Z",
    previousSnapshotId: "snapshot-previous",
  };

  return { currentSnapshot, previousSnapshot };
}
