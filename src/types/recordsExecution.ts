import type {
  MilestoneStatus,
  MilestoneType,
  MeetingType,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
  ReadinessStatus,
  ScheduleReference,
  PartInstanceDependencyCondition,
} from "./common";

export interface MilestoneRecord {
  id: string;
  seasonId: string;
  projectIds: string[];
  title: string;
  type: MilestoneType;
  status: MilestoneStatus;
  startAt: string;
  endAt: string | null;
  description: string;
  readinessStatus?: ReadinessStatus;
  photoUrl?: string;
}

export type MilestoneRequirementTargetType =
  | "project"
  | "workflow"
  | "artifact"
  | "subsystem"
  | "mechanism"
  | "part-instance";

export type MilestoneRequirementConditionType = "iteration" | "workflow_state" | "custom";

export interface MilestoneRequirementRecord {
  id: string;
  milestoneId: string;
  targetRefs: import("./common").DomainReference[];
  conditionType: "iteration" | "workflow-state" | "custom";
  conditionValue: string;
  required: boolean;
  sortOrder: number;
  notes: string;
}

export interface TaskRecord {
  id: string;
  createdAt?: string;
  serialNumber?: number;
  serial?: string;
  projectId: string;
  workTypeId: string;
  responsibleGroupId: string | null;
  workstreamIds: string[];
  title: string;
  summary: string;
  subsystemIds: string[];
  mechanismIds: string[];
  partInstanceIds: string[];
  scheduleRefs: ScheduleReference[];
  requestedById: string | null;
  photoUrl?: string;
  ownerId: string | null;
  assigneeIds: string[];
  mentorId: string | null;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  checklistItems: string[];
  isBlocked?: boolean;
  isWaitingOnDependency?: boolean;
  manufacturingDetails: ManufacturingDetailsRecord | null;
  estimatedHours: number;
  actualHours: number;
  requiresDocumentation: boolean;
}

export type ManufacturedPartRef =
  | { kind: "part-definition"; partDefinitionId: string }
  | { kind: "provisional"; partNumber: string; revision: string };

export type MaterialRequirement =
  | { kind: "inventory-material"; materialId: string }
  | { kind: "specified-material"; name: string };

export interface ManufacturingDetailsRecord {
  part: ManufacturedPartRef;
  quantity: number;
  processId: string;
  fulfillmentSource: "in-house" | "outsourced";
  material: MaterialRequirement;
  fileArtifactIds: string[];
  tolerances: string[];
  qaRequirements: string[];
  batchLabel?: string;
}

export interface TaskDependencyRecord {
  id: string;
  taskId: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  requiredCondition?: PartInstanceDependencyCondition;
  dependencyType: TaskDependencyType;
  createdAt: string;
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

export interface MeetingRecord {
  id: string;
  seasonId: string;
  projectIds: string[];
  title: string;
  meetingType: MeetingType;
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
}

export interface EventRecord {
  id: string;
  seasonId: string;
  projectIds: string[];
  eventType: "competition" | "practice" | "other";
  title: string;
  startAt: string;
  endAt: string | null;
  location: string;
  description: string;
}

export interface ManufacturingProcessRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface QaRequestRecord {
  id: string;
  projectId: string;
  targetRefs: import("./common").DomainReference[];
  subject: string;
  mentorId: string | null;
  requestedById: string | null;
  createdAt: string;
  status: "requested" | "in-review" | "complete" | "cancelled";
}

export interface EscalationRecord {
  title: string;
  detail: string;
  severity: "high" | "medium";
}

export type AuditActionOperation = "create" | "update" | "delete";

export interface AuditActionRecord {
  id: string;
  timestamp: string;
  operation: AuditActionOperation;
  entityType: string;
  entityId: string;
  entityLabel: string;
  message: string;
  changedFields: string[];
  projectId: string | null;
  taskId: string | null;
  subsystemId: string | null;
  actorMemberId: string | null;
  memberIds: string[];
}
