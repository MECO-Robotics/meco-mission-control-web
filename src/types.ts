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

export type MemberRole = "student" | "lead" | "mentor" | "admin";
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
export type MoscowPriority = "must" | "should" | "could" | "wont";
export type RequirementStatus = "planned" | "in-progress" | "complete";
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

export interface MemberRecord {
  id: string;
  name: string;
  role: MemberRole;
}

export interface SubsystemRecord {
  id: string;
  name: string;
  description: string;
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
}

export interface RequirementRecord {
  id: string;
  subsystemId: string;
  title: string;
  description: string;
  moscowPriority: MoscowPriority;
  status: RequirementStatus;
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

export interface PartDefinitionRecord {
  id: string;
  name: string;
  partNumber: string;
  revision: string;
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
  relatedSubsystemIds: string[];
}

export interface TaskRecord {
  id: string;
  title: string;
  summary: string;
  subsystemId: string;
  disciplineId: string;
  requirementId: string | null;
  mechanismId: string | null;
  partInstanceId: string | null;
  targetEventId: string | null;
  ownerId: string | null;
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
  quantity: number;
  status: ManufacturingStatus;
  mentorReviewed: boolean;
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
  quantity: number;
  status: ManufacturingStatus;
  mentorReviewed: boolean;
  batchLabel?: string;
}

export interface BootstrapPayload {
  members: MemberRecord[];
  subsystems: SubsystemRecord[];
  disciplines: DisciplineRecord[];
  mechanisms: MechanismRecord[];
  requirements: RequirementRecord[];
  materials: MaterialRecord[];
  partDefinitions: PartDefinitionRecord[];
  partInstances: PartInstanceRecord[];
  events: EventRecord[];
  tasks: TaskRecord[];
  workLogs: WorkLogRecord[];
  purchaseItems: PurchaseItemRecord[];
  manufacturingItems: ManufacturingItemRecord[];
}

export interface MemberPayload {
  name: string;
  role: MemberRole;
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

export interface PartDefinitionPayload {
  name: string;
  partNumber: string;
  revision: string;
  type: string;
  source: string;
  materialId: string | null;
  description: string;
}

export interface SubsystemPayload {
  name: string;
  description: string;
  parentSubsystemId: string | null;
  responsibleEngineerId: string | null;
  mentorIds: string[];
  risks: string[];
}

export interface MechanismPayload {
  subsystemId: string;
  name: string;
  description: string;
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
  title: string;
  summary: string;
  subsystemId: string;
  disciplineId: string;
  requirementId: string | null;
  mechanismId: string | null;
  partInstanceId: string | null;
  targetEventId: string | null;
  ownerId: string | null;
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
