import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyDraft } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTaskOpenBlockersForTask } from "@/features/workspace/shared/task/taskPlanning";

export function getTaskDependencyDrafts(
  task: TaskRecord,
  bootstrap?: BootstrapPayload,
): TaskDependencyDraft[] {
  return (bootstrap?.taskDependencies ?? [])
    .filter((dependency) => (dependency.workItemId ?? dependency.taskId) === task.id && (dependency.sourceType ?? "task") === "task")
    .map(({ id, kind, refType, refId, requiredState, dependencyType }) => ({
      id, kind, refType, refId, requiredState, dependencyType,
    }));
}

export function getTaskBlockerDrafts(task: TaskRecord, bootstrap?: BootstrapPayload) {
  return bootstrap
    ? getTaskOpenBlockersForTask(task.id, bootstrap).map((blocker) => ({
        id: blocker.id,
        blockerType: blocker.blockerType,
        blockerId: blocker.blockerId,
        description: blocker.description,
        severity: blocker.severity,
        sourceKind: blocker.sourceKind,
      }))
    : [];
}
