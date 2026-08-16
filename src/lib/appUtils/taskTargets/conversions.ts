import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { uniqueIds } from "../internal";
import { getTaskBlockerDrafts, getTaskDependencyDrafts } from "./dependencies";

export const taskToPayload = (task: TaskRecord, bootstrap?: BootstrapPayload): TaskPayload => ({
  ...task,
  workstreamIds: task.workstreamIds?.length ? task.workstreamIds : uniqueIds([task.workstreamId]),
  subsystemIds: task.subsystemIds?.length ? task.subsystemIds : uniqueIds([task.subsystemId]),
  mechanismIds: task.mechanismIds?.length ? task.mechanismIds : uniqueIds([task.mechanismId]),
  partInstanceIds: task.partInstanceIds?.length ? task.partInstanceIds : uniqueIds([task.partInstanceId]),
  artifactId: task.artifactId ?? null,
  artifactIds: task.artifactIds?.length ? uniqueIds(task.artifactIds) : uniqueIds([task.artifactId]),
  targetRiskId: task.targetRiskId ?? null,
  photoUrl: task.photoUrl ?? "",
  assigneeIds: task.assigneeIds?.length ? uniqueIds(task.assigneeIds) : uniqueIds([task.ownerId]),
  blockers: task.blockers?.length ? uniqueIds(task.blockers) : [],
  taskBlockers: getTaskBlockerDrafts(task, bootstrap),
  taskDependencies: getTaskDependencyDrafts(task, bootstrap),
});
