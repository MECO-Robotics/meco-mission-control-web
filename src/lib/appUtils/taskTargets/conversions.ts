import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { uniqueIds } from "../internal";
import { getTaskBlockerDrafts, getTaskDependencyDrafts } from "./dependencies";

export const taskToPayload = (task: TaskRecord, bootstrap?: BootstrapPayload): TaskPayload => ({
  checklistItems: task.checklistItems ?? [],
  projectId: task.projectId,
  workstreamId: task.workstreamId,
  title: task.title,
  summary: task.summary,
  subsystemId: task.subsystemId,
  disciplineId: task.disciplineId,
  mechanismId: task.mechanismId,
  partInstanceId: task.partInstanceId,
  targetMilestoneId: task.targetMilestoneId,
  ownerId: task.ownerId,
  mentorId: task.mentorId,
  startDate: task.startDate,
  dueDate: task.dueDate,
  priority: task.priority,
  status: task.status,
  estimatedHours: task.estimatedHours,
  actualHours: task.actualHours,
  linkedManufacturingIds: task.linkedManufacturingIds,
  linkedPurchaseIds: task.linkedPurchaseIds,
  requiresDocumentation: task.requiresDocumentation,
  documentationLinked: task.documentationLinked,
  workstreamIds: task.workstreamIds?.length ? task.workstreamIds : uniqueIds([task.workstreamId]),
  subsystemIds: task.subsystemIds?.length ? task.subsystemIds : uniqueIds([task.subsystemId]),
  mechanismIds: task.mechanismIds?.length ? task.mechanismIds : uniqueIds([task.mechanismId]),
  partInstanceIds: task.partInstanceIds?.length ? task.partInstanceIds : uniqueIds([task.partInstanceId]),
  artifactId: task.artifactId ?? null,
  artifactIds: task.artifactIds?.length ? uniqueIds(task.artifactIds) : uniqueIds([task.artifactId]),
  targetRiskId: bootstrap?.risks.find((risk) => risk.mitigationTaskId === task.id)?.id ?? null,
  photoUrl: task.photoUrl ?? "",
  assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
  taskBlockers: getTaskBlockerDrafts(task, bootstrap),
  taskDependencies: getTaskDependencyDrafts(task, bootstrap),
});
