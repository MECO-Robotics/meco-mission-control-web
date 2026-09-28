export type OnshapeReferenceType = "workspace" | "version" | "microversion" | "unknown";
export type SyncLevel = "link_only" | "shallow" | "bom" | "deep_release";

export interface OnshapeUrlParseResult {
  ok: boolean;
  documentId?: string;
  workspaceId?: string;
  versionId?: string;
  microversionId?: string;
  elementId?: string;
  originalUrl: string;
  referenceType: OnshapeReferenceType;
  errors: string[];
}

export interface OnshapeDocumentRefRecord {
  id: string;
  label: string;
  documentId: string;
  workspaceId?: string | null;
  versionId?: string | null;
  microversionId?: string | null;
  elementId?: string | null;
  originalUrl: string;
  referenceType: OnshapeReferenceType;
  projectId?: string | null;
  seasonId?: string | null;
  subsystemId?: string | null;
  mechanismId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CadImportRunRecord {
  id: string;
  onshapeDocumentRefId: string;
  syncLevel: SyncLevel;
  status: "pending" | "running" | "completed" | "partial" | "failed" | "canceled";
  startedAt: string;
  completedAt: string | null;
  requestedBy?: string | null;
  callsEstimated: number | null;
  callsUsed: number;
  stoppedReason: string | null;
  errorMessage: string | null;
  rawSummaryJson?: Record<string, unknown>;
}

export interface OnshapeSyncJobRecord {
  id: string;
  importRunId: string;
  onshapeDocumentRefId: string;
  status: "pending" | "running" | "completed" | "partial" | "failed" | "canceled";
  startedAt: string;
  completedAt: string | null;
  actor: string | null;
  sourceReferenceJson: Record<string, unknown>;
  summaryJson: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
}

export interface CadSnapshotRecord {
  id: string;
  label: string;
  onshapeDocumentRefId: string;
  importRunId: string;
  source: string;
  documentId: string;
  workspaceId: string | null;
  versionId: string | null;
  microversionId: string | null;
  elementId: string | null;
  immutable: boolean;
  createdAt: string;
  previousSnapshotId: string | null;
}

export interface CadAssemblyNodeRecord {
  id: string;
  snapshotId: string;
  parentAssemblyNodeId: string | null;
  instancePath: string;
  name: string;
  inferredType: string;
  subsystemId: string | null;
  mechanismId: string | null;
}

export interface CadPartDefinitionRecord {
  id: string;
  snapshotId: string;
  name: string;
  partNumber: string | null;
  material: string | null;
  configuration: string | null;
  missionControlExternalKey: string | null;
}

export interface CadPartInstanceRecord {
  id: string;
  snapshotId: string;
  cadPartDefinitionId: string | null;
  parentAssemblyNodeId: string | null;
  partId: string | null;
  instancePath: string;
  quantity: number;
  suppressed: boolean | null;
  configuration: string | null;
}

export interface CadImportWarningRecord {
  id: string;
  importRunId: string;
  snapshotId: string | null;
  severity: "info" | "warning" | "error";
  code: string;
  title: string;
  message: string;
  createdAt: string;
}

export type CadSnapshotDiffStatus = "new" | "changed" | "removed" | "unchanged";
export type CadSnapshotDiffSourceKind = "assembly_node" | "part_definition" | "part_instance";

export interface CadSnapshotDiffRecord {
  id: string;
  status: CadSnapshotDiffStatus;
  sourceKind: CadSnapshotDiffSourceKind;
  sourceId?: string | null;
  previousSourceId?: string | null;
  name: string;
  instancePath?: string | null;
  subsystemId?: string | null;
  subsystemName?: string | null;
  mechanismId?: string | null;
  mechanismName?: string | null;
  partDefinitionId?: string | null;
  partName?: string | null;
  detail?: string | null;
  changedFields?: string[];
  warningIds?: string[];
  warnings?: CadImportWarningRecord[];
}

export interface OnshapeApiBudgetRecord {
  planType: string;
  dailySoftBudget: number | null;
  perSyncSoftBudget: number | null;
  callsUsedToday: number;
  callsUsedThisMonth: number;
  callsUsedThisYear: number;
  warningThresholdPercent: number;
  hardStopThresholdPercent: number;
  lastRateLimitRemaining: number | null;
}

export interface OnshapeOAuthStatus {
  clientConfigured: boolean;
  connected: boolean;
  authorizationUrlAvailable: boolean;
  scopes: string[];
  tokenExpiresAt: string | null;
  credentialSource: "runtime" | "env" | "none";
}

export interface OnshapeSyncEstimate {
  documentRefId: string;
  syncLevel: SyncLevel;
  callsEstimated: number;
  allowCached: boolean;
  requireFresh: boolean;
  immutableReference: boolean;
  referenceType: OnshapeReferenceType;
  cacheStatus: "not_required" | "hit" | "miss" | "stale";
  perSyncSoftBudget: number | null;
  budgetAllowsSync: boolean;
  warnings: string[];
}

export interface OnshapeOverview {
  connection: {
    authMode: "api_key" | "oauth";
    baseUrl: string;
    configured: boolean;
    credentialReference: string | null;
    oauth?: OnshapeOAuthStatus;
    lastError: string | null;
  };
  documentRefs: OnshapeDocumentRefRecord[];
  importRuns: CadImportRunRecord[];
  syncJobs?: OnshapeSyncJobRecord[];
  snapshots: CadSnapshotRecord[];
  latestSnapshot: CadSnapshotRecord | null;
  assemblyNodes: CadAssemblyNodeRecord[];
  partDefinitions: CadPartDefinitionRecord[];
  partInstances: CadPartInstanceRecord[];
  warnings: CadImportWarningRecord[];
  snapshotDiffRecords?: CadSnapshotDiffRecord[];
  snapshotDiff?: {
    previousSnapshotId?: string | null;
    currentSnapshotId?: string | null;
    records: CadSnapshotDiffRecord[];
  };
  budget: OnshapeApiBudgetRecord;
}

export interface CadGraphImportResult {
  importRunId: string;
  snapshotId?: string;
  status: "completed" | "partial" | "failed";
  callsUsed: number;
  assemblyNodeCount: number;
  partDefinitionCount: number;
  partInstanceCount: number;
  warningCount: number;
  stoppedReason?: string;
}

