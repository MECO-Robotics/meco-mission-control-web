export type MemberRole = "student" | "lead" | "mentor" | "admin" | "external";
export type EventType =
  | "practice"
  | "competition"
  | "deadline"
  | "internal-review"
  | "demo";
export type DisciplineCode =
  | "design"
  | "manufacturing"
  | "assembly"
  | "electrical"
  | "programming"
  | "testing"
  | "planning"
  | "communications"
  | "finance"
  | "research"
  | "documentation"
  | "engagement"
  | "presentation"
  | "media_production"
  | "partnerships"
  | "game_analysis"
  | "scouting"
  | "data_analysis"
  | "risk_review"
  | "curriculum"
  | "instruction"
  | "practice"
  | "assessment"
  | "photography"
  | "video"
  | "graphics"
  | "writing"
  | "web"
  | "social_media";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "waiting-for-qa"
  | "complete";
export type TaskPlanningState =
  | "ready"
  | "waiting-on-dependency"
  | "blocked"
  | "overdue"
  | "at-risk";
export type TaskDependencyType = "blocks" | "soft" | "finish_to_start";
export type TaskBlockerType =
  | "task"
  | "event"
  | "workstream"
  | "mechanism"
  | "part_instance"
  | "artifact_instance"
  | "external";
export type TaskBlockerSeverity = "low" | "medium" | "high" | "critical";
export type TaskBlockerStatus = "open" | "resolved";
export type ManufacturingProcess = "3d-print" | "cnc" | "fabrication";
export type ManufacturingStatus =
  | "requested"
  | "approved"
  | "in-progress"
  | "qa"
  | "complete";
export type PurchaseStatus =
  | "requested"
  | "approved"
  | "purchased"
  | "shipped"
  | "delivered";
export type MaterialCategory =
  | "metal"
  | "plastic"
  | "filament"
  | "electronics"
  | "hardware"
  | "consumable"
  | "other";
export type ArtifactKind = "document" | "nontechnical";
export type ArtifactStatus = "draft" | "in-review" | "published";
export type SeasonType = "season" | "offseason" | "initiative";
export type ProjectType = "robot" | "operations" | "outreach" | "other";
export type ProjectStatus = "planned" | "active" | "paused" | "complete";
export type TestResultStatus = "pass" | "fail" | "blocked";
export type ReportType = "QA" | "EventTest" | "Practice" | "Competition" | "Review";
export type RiskSeverity = "high" | "medium" | "low";
export type RiskAttachmentType = "project" | "workstream" | "mechanism" | "part-instance";
export type FindingStatus = "open" | "resolved";
export type DesignIterationSourceType = "qa-finding" | "test-finding" | "manual";

export interface MemberRecord {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  elevated: boolean;
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

export interface EventPayload {
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

export interface ReportPayload {
  reportType: ReportType;
  projectId: string;
  taskId: string | null;
  eventId: string | null;
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

export type QaReportRecord = ReportRecord;
export type QaReportPayload = ReportPayload;
export type TestResultRecord = ReportRecord;
export type TestResultPayload = ReportPayload;

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
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}

export interface TaskDependencyDraft {
  id?: string;
  upstreamTaskId: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerDraft {
  id?: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
}

export interface TaskDependencyRecord {
  id: string;
  upstreamTaskId: string;
  downstreamTaskId: string;
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

export interface WorkLogPayload {
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
  photoUrl: string;
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

export interface BootstrapPayload {
  seasons: SeasonRecord[];
  projects: ProjectRecord[];
  workstreams: WorkstreamRecord[];
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  disciplines: DisciplineRecord[];
  mechanisms: MechanismRecord[];
  materials: MaterialRecord[];
  artifacts: ArtifactRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  events: EventRecord[];
  taskDependencies?: TaskDependencyRecord[];
  taskBlockers?: TaskBlockerRecord[];
  reports: ReportRecord[];
  reportFindings: ReportFindingRecord[];
  qaReports: QaReportRecord[];
  testResults: TestResultRecord[];
  qaFindings: QaFindingRecord[];
  testFindings: TestFindingRecord[];
  designIterations: DesignIterationRecord[];
  risks: RiskRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
  attendanceRecords?: AttendanceRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingItems: ManufacturingItemRecord[];
}

export type PlatformBootstrapPayload = BootstrapPayload;

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
  role: MemberRole;
  elevated: boolean;
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
  status: PartInstanceRecord["status"];
  photoUrl: string;
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
  targetEventId: string | null;
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
  upstreamTaskId: string;
  downstreamTaskId: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerPayload {
  blockedTaskId: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
  status?: TaskBlockerStatus;
  createdByMemberId?: string | null;
}
