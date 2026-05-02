import type {
  ArtifactKind,
  ArtifactStatus,
  DesignIterationSourceType,
  DisciplineCode,
  EventType,
  FindingStatus,
  ManufacturingProcess,
  ManufacturingStatus,
  MaterialCategory,
  MemberRole,
  ProjectStatus,
  ProjectType,
  PurchaseStatus,
  ReportType,
  RiskAttachmentType,
  RiskSeverity,
  SeasonType,
  TaskBlockerSeverity,
  TaskBlockerStatus,
  TaskBlockerType,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPlanningState,
  TaskPriority,
  TaskStatus,
  TestResultStatus,
} from "./common";

export interface MemberRecord {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: MemberRole;
  elevated: boolean;
  disciplineId?: string | null;
  seasonId: string;
  activeSeasonIds?: string[];
}

export interface SubsystemRecord {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  description: string;
  photoUrl?: string;
  iteration: number;
  isArchived?: boolean;
  isCore: boolean;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  risks: string[];
}

export interface DisciplineRecord {
  id: string;
  code: DisciplineCode;
  name: string;
}

export interface MechanismRecord {
  id: string;
  subsystemId: string;
  name: string;
  description: string;
  photoUrl?: string;
  iteration: number;
  isArchived?: boolean;
}

export interface MaterialRecord {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  onHandQuantity: number;
  reorderPoint: number;
  location: string;
  vendor: string;
  notes: string;
}

export interface ArtifactRecord {
  id: string;
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

export interface PartDefinitionRecord {
  id: string;
  seasonId: string;
  activeSeasonIds?: string[];
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  isHardware?: boolean;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
  photoUrl?: string;
}

export interface PartInstanceRecord {
  id: string;
  subsystemId: string;
  mechanismId: string | null;
  partDefinitionId: string;
  name: string;
  quantity: number;
  trackIndividually: boolean;
  status: "planned" | "needed" | "available" | "installed" | "retired";
  photoUrl?: string;
}

export interface EventRecord {
  id: string;
  title: string;
  type: EventType;
  startDateTime: string;
  endDateTime: string | null;
  isExternal: boolean;
  description: string;
  projectIds: string[];
  relatedSubsystemIds: string[];
  photoUrl?: string;
}

export interface SeasonRecord {
  id: string;
  name: string;
  type: SeasonType;
  startDate: string;
  endDate: string;
}

export interface ProjectRecord {
  id: string;
  seasonId: string;
  name: string;
  projectType: ProjectType;
  description: string;
  status: ProjectStatus;
}

export interface WorkstreamRecord {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  description: string;
  isArchived?: boolean;
}

export interface ReportRecord {
  id: string;
  reportType: ReportType;
  projectId: string;
  taskId: string | null;
  eventId: string | null;
  workstreamId: string | null;
  createdByMemberId: string | null;
  result: string;
  summary: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
  participantIds?: string[];
  mentorApproved?: boolean;
  reviewedAt?: string;
  title?: string;
  status?: TestResultStatus;
  findings?: string[];
}

export interface ReportFindingRecord {
  id: string;
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
  title?: string;
  detail?: string;
  status?: FindingStatus;
  projectId?: string;
  workstreamId?: string | null;
  subsystemId?: string | null;
  taskId?: string | null;
  eventId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type QaReportRecord = ReportRecord;
export type TestResultRecord = ReportRecord;

export interface QaFindingRecord {
  id: string;
  taskId: string | null;
  qaReportId: string | null;
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: FindingStatus;
}

export interface TestFindingRecord {
  id: string;
  taskId: string | null;
  testResultId: string | null;
  title: string;
  detail: string;
  severity: RiskSeverity;
  status: FindingStatus;
}

export interface DesignIterationRecord {
  id: string;
  taskId: string | null;
  sourceType: DesignIterationSourceType;
  sourceId: string | null;
  title: string;
  summary: string;
  createdAt: string;
}

export interface RiskRecord {
  id: string;
  title: string;
  detail: string;
  severity: RiskSeverity;
  sourceType: "qa-report" | "test-result";
  sourceId: string;
  attachmentType: RiskAttachmentType;
  attachmentId: string;
  mitigationTaskId: string | null;
}

export interface TaskRecord {
  id: string;
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
  targetEventId: string | null;
  photoUrl?: string;
  ownerId: string | null;
  assigneeIds: string[];
  mentorId: string | null;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  planningState?: TaskPlanningState;
  dependencyIds: string[];
  blockers: string[];
  isBlocked?: boolean;
  isWaitingOnDependency?: boolean;
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}

export interface TaskDependencyRecord {
  id: string;
  taskId: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  dependencyType: TaskDependencyType;
  createdAt: string;
}

export interface TaskBlockerRecord {
  id: string;
  blockedTaskId: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
  status: TaskBlockerStatus;
  createdByMemberId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface WorkLogRecord {
  id: string;
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  totalHours: number;
}

export interface ManufacturingItemRecord {
  id: string;
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

export interface PurchaseItemRecord {
  id: string;
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
