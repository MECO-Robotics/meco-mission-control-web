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
  callsEstimated: number | null;
  callsUsed: number;
  stoppedReason: string | null;
  errorMessage: string | null;
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
    lastError: string | null;
  };
  documentRefs: OnshapeDocumentRefRecord[];
  importRuns: CadImportRunRecord[];
  snapshots: CadSnapshotRecord[];
  latestSnapshot: CadSnapshotRecord | null;
  assemblyNodes: CadAssemblyNodeRecord[];
  partDefinitions: CadPartDefinitionRecord[];
  partInstances: CadPartInstanceRecord[];
  warnings: CadImportWarningRecord[];
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

export interface CadStepImportRunRecord {
  id: string;
  projectId: string | null;
  seasonId: string | null;
  source: "STEP_UPLOAD" | "ONSHAPE_API" | "ONSHAPE_BOM_CSV" | "MANUAL_BOM_CSV";
  status: "PENDING" | "PARSING" | "PARSED" | "MAPPING_REVIEW" | "MAPPED" | "FINALIZED" | "FAILED" | "CANCELED";
  originalFilename: string;
  uploadedFileHash: string | null;
  parserVersion: string | null;
  parseStartedAt: string | null;
  parseCompletedAt: string | null;
  rawSummaryJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CadStepSnapshotRecord {
  id: string;
  projectId: string | null;
  seasonId: string | null;
  importRunId: string;
  source: "STEP_UPLOAD" | "ONSHAPE_API" | "ONSHAPE_BOM_CSV" | "MANUAL_BOM_CSV";
  label: string;
  uploadedFileHash: string | null;
  previousSnapshotId: string | null;
  status: "parsed" | "mapping_review" | "mapped" | "finalized" | "superseded";
  createdBy: string | null;
  createdAt: string;
  finalizedBy: string | null;
  finalizedAt: string | null;
  notes: string | null;
}

export interface CadStepImportSummary {
  assemblyCount: number;
  partDefinitionCount: number;
  partInstanceCount: number;
  maxDepth?: number;
  parserVersion?: string;
  actualParserVersion?: string;
  configuredParserMode?: string;
  parserMode?: string;
  productCount?: number;
  productDefinitionCount?: number;
  productDefinitionFormationCount?: number;
  assemblyUsageCount?: number;
  nextAssemblyUsageOccurrenceCount?: number;
  rootName?: string | null;
  rootNames?: string[];
  topLevelAssemblies?: string[];
  topLevelAssemblyNames?: string[];
  topLevelDetectedAssemblies?: string[];
  parserUsedPlaceholder?: boolean;
  rawStats?: Record<string, unknown>;
  warningCount: number;
  mappingCount: number;
}

export interface CadStepWarningRecord {
  id: string;
  importRunId: string;
  snapshotId: string | null;
  severity: "INFO" | "WARNING" | "ERROR";
  code: string;
  title: string;
  message: string;
  sourceKind: "ASSEMBLY_NODE" | "PART_DEFINITION" | "PART_INSTANCE" | null;
  sourceId: string | null;
  createdAt: string;
}

export interface CadStepTreeNode {
  id: string;
  sourceId: string;
  name: string;
  inferredType: string;
  instancePath: string;
  depth: number;
  mapping: CadStepMappingRecord | null;
  children: CadStepTreeNode[];
  partInstances: CadStepTreePartInstanceRecord[];
}

export type CadStepTreePartInstanceRecord = {
    id: string;
    sourceId: string;
    instancePath: string;
    quantity: number;
    mapping: CadStepMappingRecord | null;
    partDefinition: { id: string; name: string; partNumber: string | null } | null;
  } | {
    kind: "part_instance_group";
    groupId: string;
    parentAssemblyNodeId: string | null;
    partDefinitionId: string | null;
    partDefinition: { id: string; name: string; partNumber: string | null } | null;
    displayName: string;
    quantity: number;
    instanceIds: string[];
    sourceIds: string[];
    instancePaths: string[];
    stableSignatures: string[];
    mapping: CadStepMappingRecord | null;
    mappings: CadStepMappingRecord[];
    hasMixedMappings: boolean;
    hasMixedMetadata: boolean;
    representativeInstanceId: string;
  };

export interface CadStepMappingRecord {
  id: string;
  kind?: "part_instance_group";
  snapshotId: string;
  mappingRuleId: string | null;
  sourceKind: "ASSEMBLY_NODE" | "PART_DEFINITION" | "PART_INSTANCE";
  sourceId: string;
  sourceIds?: string[];
  sourceName: string;
  targetKind: "SUBSYSTEM" | "MECHANISM" | "PART_DEFINITION" | "PART_INSTANCE" | "IGNORE" | "REFERENCE_GEOMETRY" | "UNMAPPED";
  targetId: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MANUAL";
  status: "PROPOSED" | "CONFIRMED" | "REJECTED" | "NEEDS_REVIEW";
  rule: { id: string; confidence: string } | null;
  quantity?: number;
  hasMixedMappings?: boolean;
  warningCode?: string | null;
  warning?: string | null;
  updatedAt: string;
}

export interface CadStepDiff {
  previousSnapshotId: string | null;
  addedAssemblies: Array<{ id: string; name: string; instancePath: string }>;
  removedAssemblies: Array<{ id: string; name: string; instancePath: string }>;
  movedAssemblies: Array<{ name: string; previousParentSourceId: string | null; currentParentSourceId: string | null }>;
  addedParts: Array<{ id: string; name: string; partNumber: string | null }>;
  removedParts: Array<{ id: string; name: string; partNumber: string | null }>;
  movedPartInstances: Array<{
    sourceId: string;
    previousParentAssemblyName: string | null;
    currentParentAssemblyName: string | null;
  }>;
  quantityChangedPartGroups?: Array<{
    parentAssemblyName: string | null;
    partName: string;
    previousQuantity: number;
    currentQuantity: number;
    addedInstancePaths: string[];
    removedInstancePaths: string[];
  }>;
  mappingChanges: Array<Record<string, unknown>>;
  warnings: CadStepWarningRecord[];
}
