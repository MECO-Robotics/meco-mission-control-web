import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyDraft } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";

export function getTaskDependencyDrafts(
  task: TaskRecord,
  bootstrap?: BootstrapPayload,
): TaskDependencyDraft[] {
  return (bootstrap?.taskDependencies ?? [])
    .filter((dependency) => dependency.taskId === task.id)
    .map(({ id, kind, refId, requiredState, dependencyType }) => ({
      id, kind, refId, requiredState, dependencyType,
    }));
}
