import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyDraft } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTaskOpenBlockersForTask } from "@/features/workspace/shared/task/taskPlanning";
import { uniqueIds } from "../internal";

export function getTaskDependencyDrafts(
  task: TaskRecord,
  bootstrap?: BootstrapPayload,
): TaskDependencyDraft[] {
  const explicitDependencies = bootstrap?.taskDependencies?.filter(
    (dependency) => dependency.taskId === task.id,
  );

  const fallbackDependencies = uniqueIds(task.dependencyIds ?? []).map((upstreamTaskId) => ({
    kind: "task" as const,
    refId: upstreamTaskId,
    requiredState: "complete",
    dependencyType: "hard" as const,
  }));

  if (explicitDependencies && explicitDependencies.length > 0) {
    const explicitDrafts = explicitDependencies.map((dependency) => ({
      id: dependency.id,
      kind: dependency.kind,
      refId: dependency.refId,
      requiredState: dependency.requiredState,
      dependencyType: dependency.dependencyType,
    }));
    const explicitKeys = new Set(
      explicitDrafts.map(
        (dependency) =>
          `${dependency.kind}:${dependency.refId}:${dependency.dependencyType}:${dependency.requiredState ?? ""}`,
      ),
    );

    return [
      ...explicitDrafts,
      ...fallbackDependencies.filter(
        (dependency) =>
          !explicitKeys.has(
            `${dependency.kind}:${dependency.refId}:${dependency.dependencyType}:${dependency.requiredState ?? ""}`,
          ),
      ),
    ];
  }

  return fallbackDependencies;
}

export function getTaskBlockerDrafts(task: TaskRecord, bootstrap?: BootstrapPayload) {
  return bootstrap
    ? getTaskOpenBlockersForTask(task.id, bootstrap).map((blocker) => ({
        id: blocker.id,
        blockerType: blocker.blockerType,
        blockerId: blocker.blockerId,
        description: blocker.description,
        severity: blocker.severity,
      }))
    : [];
}
