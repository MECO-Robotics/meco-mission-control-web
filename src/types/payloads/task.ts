import type {
  PartInstanceDependencyCondition,
  ScheduleReference,
  TaskDependencyKind,
  TaskDependencyType,
  TaskPriority,
  TaskStatus,
  TaskWorkflowStatus,
} from "../common";
import type { ManufacturingDetailsRecord } from "../recordsExecution";

export interface TaskDependencyDraft {
  id?: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  requiredCondition?: PartInstanceDependencyCondition;
  dependencyType: TaskDependencyType;
}

export interface TaskPayload {
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
  photoUrl: string;
  ownerId: string | null;
  assigneeIds: string[];
  mentorId: string | null;
  startDate: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  checklistItems: string[];
  estimatedHours: number;
  requiresDocumentation: boolean;
  manufacturingDetails: ManufacturingDetailsRecord | null;
  taskDependencies?: TaskDependencyDraft[];
}

export type TaskPatchPayload = Omit<TaskPayload, "status"> & { status: TaskWorkflowStatus };

export interface TaskDependencyPayload {
  taskId: string;
  kind: TaskDependencyKind;
  refId: string;
  requiredState?: string;
  requiredCondition?: PartInstanceDependencyCondition;
  dependencyType: TaskDependencyType;
}
