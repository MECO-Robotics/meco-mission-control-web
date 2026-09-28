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
    snapshotId?: string;
    sourceId: string;
    partDefinitionId?: string | null;
    parentAssemblyNodeId?: string | null;
    instancePath: string;
    quantity: number;
    stableSignature?: string;
    metadataJson?: Record<string, unknown>;
    createdAt?: string;
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

export type CadStepMappingRuleMatchStrategy =
  | "STABLE_SIGNATURE"
  | "INSTANCE_PATH"
  | "NORMALIZED_NAME"
  | "NORMALIZED_NAME_WITH_PARENT"
  | "MANUAL_ONLY";

export interface CadStepMappingRecord {
  id: string;
  kind?: "part_instance_group";
  snapshotId: string;
  mappingRuleId: string | null;
  sourceKind: "ASSEMBLY_NODE" | "PART_DEFINITION" | "PART_INSTANCE";
  sourceId: string;
  sourceIds?: string[];
  sourceName: string;
  parentAssemblyName?: string | null;
  targetKind: "SUBSYSTEM" | "MECHANISM" | "PART_DEFINITION" | "PART_INSTANCE" | "IGNORE" | "REFERENCE_GEOMETRY" | "UNMAPPED";
  targetId: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MANUAL";
  status: "PROPOSED" | "CONFIRMED" | "REJECTED" | "NEEDS_REVIEW";
  rule: { id: string; confidence: string; matchStrategy?: CadStepMappingRuleMatchStrategy } | null;
  quantity?: number;
  hasMixedMappings?: boolean;
  warningCode?: string | null;
  warning?: string | null;
  updatedAt: string;
}

export type CadHierarchySourceKind = "ASSEMBLY_NODE" | "PART_DEFINITION" | "PART_INSTANCE";
export type CadHierarchyTargetKind =
  | "SUBSYSTEM"
  | "MECHANISM"
  | "COMPONENT_ASSEMBLY"
  | "PART_DEFINITION"
  | "IGNORE"
  | "REFERENCE_GEOMETRY"
  | "UNMAPPED";

export interface CadHierarchyPartSummary {
  rawInstanceCount: number;
  groupedPartCount: number;
  matchedExistingDefinitionCount: number;
  proposedNewDefinitionCount: number;
  ambiguousMatchCount: number;
  unresolvedCount: number;
  totalQuantity?: number;
  groups?: Array<{
    name: string;
    quantity: number;
    cadPartDefinitionId: string | null;
    cadPartDefinitionSourceId: string | null;
    resolvedPartDefinitionId: string | null;
    status: string;
  }>;
}

export interface CadHierarchyNode {
  id: string;
  sourceKind: CadHierarchySourceKind;
  sourceId: string;
  name: string;
  instancePath: string;
  inferredType: string;
  proposedClassification: string | null;
  resolvedSubsystemId: string | null;
  resolvedMechanismId: string | null;
  resolvedComponentAssemblyId: string | null;
  resolvedPartDefinitionId: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MANUAL" | string;
  status: "PROPOSED" | "CONFIRMED" | "REJECTED" | "NEEDS_REVIEW" | string;
  children: CadHierarchyNode[];
  partSummary?: CadHierarchyPartSummary | null;
}

export interface CadPartMatchProposalCandidate {
  id?: string;
  partDefinitionId: string;
  label: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MANUAL" | string;
  reason?: string | null;
  strategy?: string;
  score?: number;
}

export interface CadPartMatchProposal {
  id: string;
  hierarchyNodeId: string;
  cadPartDefinitionId?: string;
  cadPartDefinitionSourceId?: string;
  cadPartName?: string;
  cadPartNumber?: string | null;
  instanceQuantity?: number;
  recommendedPartDefinitionId?: string | null;
  sourcePartName: string;
  parentHierarchyName?: string | null;
  candidates: CadPartMatchProposalCandidate[];
  status: "EXACT" | "AMBIGUOUS" | "SUGGESTED" | "NO_MATCH" | "PROPOSED" | "CONFIRMED" | "REJECTED" | string;
}

export interface CadHierarchyIssue {
  code: string;
  title?: string;
  message: string;
  severity: "BLOCKING" | "WARNING" | "INFO" | "ERROR" | string;
  sourceKind?: CadHierarchySourceKind;
  sourceId?: string;
}

export interface CadHierarchyReview {
  snapshotId: string;
  root: CadHierarchyNode | null;
  unresolved: CadHierarchyIssue[];
  partMatchProposals: CadPartMatchProposal[];
  warnings: CadHierarchyIssue[];
}

export interface CadHierarchyReviewDecision {
  nodeId: string;
  sourceId?: string;
  sourceKind?: CadHierarchySourceKind;
  targetKind: CadHierarchyTargetKind;
  targetId?: string | null;
  parentSubsystemId?: string | null;
  parentMechanismId?: string | null;
  status?: "CONFIRMED" | "REJECTED" | "NEEDS_REVIEW";
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
