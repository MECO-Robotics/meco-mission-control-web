import type {
  TaskBlockerSeverity,
  TaskBlockerSourceKind,
  TaskBlockerType,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
} from "../common";

export interface TaskDependencyDraft {
  id?: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerDraft {
  id?: string;
  blockerType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  isIntentPlaceholder?: boolean;
  severity: TaskBlockerSeverity;
  sourceKind?: string | null;
}

export interface TaskPayload {
  checklistItems?: string[];
  projectId: string;
  workstreamIds: string[];
  title: string;
  summary: string;
  subsystemIds: string[];
  disciplineId: string;
  mechanismIds: string[];
  partInstanceIds: string[];
  artifactIds: string[];
  targetRiskId?: string | null;
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
  requiredState: string;
  dependencyType: TaskDependencyType;
}

export interface TaskBlockerPayload {
  blockedTaskId: string;
  blockerType: TaskBlockerSourceKind;
  issueType: TaskBlockerType;
  blockerId: string | null;
  description: string;
  severity: TaskBlockerSeverity;
  status: "open" | "resolved";
  createdByMemberId?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
}
