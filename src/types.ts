export type RoleFilter = "all" | "students" | "mentors" | "admins";

export interface PortalCard {
  title: string;
  topline: string;
  metric: string;
  description: string;
  roles: Exclude<RoleFilter, "all">[];
  items: string[];
}

export interface WorkflowLane {
  title: string;
  metric: string;
  summary: string;
  tags: string[];
}

export interface SubsystemCard {
  name: string;
  lead: string;
  mentor: string;
  progress: number;
}

export type MemberRole = "student" | "lead" | "mentor" | "admin" | "external";
export type EventType =
  | "drive-practice"
  | "competition"
  | "deadline"
  | "internal-review"
  | "demo";
export type DisciplineCode =
  | "mechanical"
  | "electrical"
  | "software"
  | "integration"
  | "qa-test";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "not-started"
  | "in-progress"
  | "waiting-for-qa"
  | "complete";
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
  description: string;
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
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
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
  description: string;
  isArchived?: boolean;
}

export interface QaReportRecord {
  id: string;
  taskId: string;
  participantIds: string[];
  result: "pass" | "minor-fix" | "iteration-worthy";
  mentorApproved: boolean;
  notes: string;
  reviewedAt: string;
}

export interface QaReportPayload {
  taskId: string;
  participantIds: string[];
  result: "pass" | "minor-fix" | "iteration-worthy";
  mentorApproved: boolean;
  notes: string;
  reviewedAt: string;
}

export interface TestResultRecord {
  id: string;
  eventId: string;
  title: string;
  status: TestResultStatus;
  findings: string[];
}

export interface TestResultPayload {
  eventId: string;
  title: string;
  status: TestResultStatus;
  findings: string[];
}

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
  ownerId: string | null;
  assigneeIds: string[];
  mentorId: string | null;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  dependencyIds: string[];
  blockers: string[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}

export interface WorkLogRecord {
  id: string;
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
}

export interface WorkLogPayload {
  taskId: string;
  date: string;
  hours: number;
  participantIds: string[];
  notes: string;
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
  qaReports: QaReportRecord[];
  testResults: TestResultRecord[];
  qaFindings: QaFindingRecord[];
  testFindings: TestFindingRecord[];
  designIterations: DesignIterationRecord[];
  risks: RiskRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
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
  name: string;
  partNumber: string;
  revision: string;
  iteration: number;
  isArchived?: boolean;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
}

export interface SubsystemPayload {
  projectId: string;
  name: string;
  description: string;
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
  dependencyIds: string[];
  linkedManufacturingIds: string[];
  linkedPurchaseIds: string[];
  requiresDocumentation: boolean;
  documentationLinked: boolean;
}
