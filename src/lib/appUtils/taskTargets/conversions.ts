import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";
import { uniqueIds } from "../internal";
import { getTaskDependencyDrafts } from "./dependencies";

export const taskToPayload = (task: TaskRecord, bootstrap?: BootstrapPayload): TaskPayload => ({
  checklistItems: task.checklistItems ?? [],
  projectId: task.projectId,
  title: task.title,
  summary: task.summary,
  workTypeId: task.workTypeId,
  responsibleGroupId: task.responsibleGroupId,
  ownerId: task.ownerId,
  mentorId: task.mentorId,
  startDate: task.startDate,
  dueDate: task.dueDate,
  priority: task.priority,
  status: task.status,
  estimatedHours: task.estimatedHours,
  requiresDocumentation: task.requiresDocumentation,
  manufacturingDetails: task.manufacturingDetails,
  workstreamIds: task.workstreamIds,
  subsystemIds: task.subsystemIds,
  mechanismIds: task.mechanismIds,
  partInstanceIds: task.partInstanceIds,
  scheduleRefs: task.scheduleRefs,
  requestedById: task.requestedById,
  photoUrl: task.photoUrl ?? "",
  assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
  taskDependencies: getTaskDependencyDrafts(task, bootstrap),
});
