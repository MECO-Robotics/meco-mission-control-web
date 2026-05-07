import type {
  ArtifactKind,
  ArtifactStatus,
  MilestoneType,
  ManufacturingProcess,
  ManufacturingStatus,
  MaterialCategory,
  MemberRole,
  ProjectStatus,
  ProjectType,
  PurchaseStatus,
  RiskAttachmentType,
  RiskSeverity,
  SeasonType,
  TaskBlockerSeverity,
  TaskBlockerType,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
  TestResultStatus,
} from "./common";
import type { PartInstanceRecord as PartInstanceRecordType } from "./recordsInventory";

export interface MilestonePayload {
  title: string;
  type: MilestoneType;
  startDateTime: string;
  endDateTime: string | null;
  isExternal: boolean;
  description: string;
  projectIds: string[];
  photoUrl?: string;
}

export interface ReportPayload {
  reportType: "QA" | "MilestoneTest" | "Practice" | "Competition" | "Review";
  projectId: string;
  taskId: string | null;
  milestoneId: string | null;
  workstreamId: string | null;
  createdByMemberId: string | null;
  result: string;
  summary: string;
  notes: string;
  photoUrl: string;
  createdAt: string;
  participantIds?: string[];
  mentorApproved?: boolean;
  reviewedAt?: string;
  title?: string;
  status?: TestResultStatus;
  findings?: string[];
}

export interface ReportFindingPayload {
  reportId: string;
  mechanismId: string | null;
  partInstanceId: string | null;
  artifactInstanceId: string | null;
  issueType: string;
  severity: RiskSeverity;
  notes: string;
  spawnedTaskId: string | null;
  spawnedIterationId: string | null;
  spawnedRiskId: string | null;
}

export type QaReportPayload = ReportPayload;
export type TestResultPayload = ReportPayload;

export interface WorkLogPayload {
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
  photoUrl: string;
}

export interface ManufacturingItemPayload {
  title: string;
  subsystemId: string;
  requestedById: string | null;
  process: ManufacturingProcess;
  dueDate: string;
  material: string;
  materialId: string | null;
  partDefinitionId: string | null;
  partInstanceId: string | null;
  partInstanceIds: string[];
  quantity: number;
  status: ManufacturingStatus;
  mentorReviewed: boolean;
  inHouse: boolean;
  batchLabel?: string;
}

export interface PurchaseItemPayload {
  title: string;
  subsystemId: string;
  requestedById: string | null;
  partDefinitionId: string | null;
  quantity: number;
  vendor: string;
  linkLabel: string;
  estimatedCost: number;
  finalCost?: number;
  approvedByMentor: boolean;
  status: PurchaseStatus;
}

export interface SeasonCreatePayload {
  name: string;
  type?: SeasonType;
  startDate?: string;
  endDate?: string;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectCreatePayload extends ProjectPayload {
  seasonId: string;
  projectType: ProjectType;
}

export interface MemberPayload {
  name: string;
  email: string;
  photoUrl: string;
  role: MemberRole;
  elevated: boolean;
  disciplineId?: string | null;
  activeSeasonIds?: string[];
}

export interface MemberCreatePayload extends MemberPayload {
  seasonId: string;
}

export interface MaterialPayload {
  name: string;
  category: MaterialCategory;
  unit: string;
  onHandQuantity: number;
  reorderPoint: number;
  location: string;
  vendor: string;
  notes: string;
}

export interface ArtifactPayload {
  projectId: string;
  workstreamId: string | null;
  kind: ArtifactKind;
  title: string;
  summary: string;
  status: ArtifactStatus;
  link: string;
  isArchived?: boolean;
  updatedAt: string;
}

export interface WorkstreamPayload {
  projectId: string;
  name: string;
  color: string;
  description: string;
  isArchived?: boolean;
}

export interface RiskPayload {
  title: string;
  detail: string;
  severity: RiskSeverity;
  sourceType: "qa-report" | "test-result";
  sourceId: string;
  attachmentType: RiskAttachmentType;
  attachmentId: string;
  mitigationTaskId: string | null;
}

export interface PartDefinitionPayload {
  seasonId?: string;
  activeSeasonIds?: string[];
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  isHardware: boolean;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
  photoUrl: string;
}

export interface SubsystemPayload {
  projectId: string;
  name: string;
  color: string;
  description: string;
  photoUrl: string;
  iteration: number;
  isArchived?: boolean;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  risks: string[];
}

export interface MechanismPayload {
  subsystemId: string;
  name: string;
  description: string;
  googleSheetsUrl: string;
  photoUrl: string;
  iteration: number;
  isArchived?: boolean;
}

export interface PartInstancePayload {
  subsystemId: string;
  mechanismId: string | null;
  partDefinitionId: string;
  name: string;
  quantity: number;
  trackIndividually: boolean;
  status: PartInstanceRecordType["status"];
  photoUrl: string;
}

export interface TaskDependencyDraft {
  id?: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerDraft {
  id?: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
}

export interface TaskPayload {
  projectId: string;
  workstreamId: string | null;
  workstreamIds: string[];
  title: string;
  summary: string;
  subsystemId: string;
  subsystemIds: string[];
  disciplineId: string;
  mechanismId: string | null;
  mechanismIds: string[];
  partInstanceId: string | null;
  partInstanceIds: string[];
  artifactId?: string | null;
  artifactIds?: string[];
  targetMilestoneId: string | null;
  photoUrl: string;
  ownerId: string | null;
  assigneeIds: string[];
  mentorId: string | null;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  blockers: string[];
  taskBlockers?: TaskBlockerDraft[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  requiresDocumentation: boolean;
  documentationLinked: boolean;
  taskDependencies?: TaskDependencyDraft[];
}

export interface TaskDependencyPayload {
  taskId: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerPayload {
  blockedTaskId: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
  status: "open" | "resolved";
  createdByMemberId?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
}
