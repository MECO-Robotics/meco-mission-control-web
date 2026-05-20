import type {
  MilestoneStatus,
  MilestoneType,
  TaskBlockerSeverity,
  TaskBlockerStatus,
  TaskBlockerType,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPlanningState,
  TaskPriority,
  TaskStatus,
} from "./common";

export interface MilestoneRecord {
  id: string;
  title: string;
  type: MilestoneType;
  status?: MilestoneStatus;
  startDateTime: string;
  endDateTime: string | null;
  isExternal: boolean;
  description: string;
  projectIds: string[];
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
  targetType: MilestoneRequirementTargetType;
  targetId: string;
  conditionType: MilestoneRequirementConditionType;
  conditionValue: string;
  required: boolean;
  sortOrder: number;
  notes: string;
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
  targetMilestoneId: string | null;
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

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  time: string;
  rsvpsYes: number;
  rsvpsMaybe: number;
  openSignIns: number;
}

export type QaReviewResult = "pass" | "minor-fix" | "iteration-worthy";

export interface QaReviewRecord {
  id: string;
  subjectId: string;
  subjectType: "task" | "manufacturing";
  subjectTitle: string;
  participantIds: string[];
  result: QaReviewResult;
  mentorApproved: boolean;
  notes: string;
  reviewedAt: string;
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
