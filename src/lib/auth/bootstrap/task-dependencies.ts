import type { TaskDependencyRecord } from "@/types/recordsExecution";
import type { LegacyBootstrapPayload } from "./shared";

export function normalizeBootstrapTaskDependencies(
  source: LegacyBootstrapPayload,
): TaskDependencyRecord[] {
  return (source.taskDependencies ?? []).map((dependency, index) => ({
    id: (dependency as { id?: string }).id ?? `task-dependency-${index + 1}`,
    taskId:
      (dependency as { taskId?: string; downstreamTaskId?: string }).taskId ??
      (dependency as { downstreamTaskId?: string }).downstreamTaskId ??
      "",
    kind: (dependency as { kind?: TaskDependencyRecord["kind"] }).kind ?? "task",
    refId:
      (dependency as { refId?: string; upstreamTaskId?: string }).refId ??
      (dependency as { upstreamTaskId?: string }).upstreamTaskId ??
      "",
    requiredState:
      (dependency as { requiredState?: string }).requiredState ??
      ((((dependency as { kind?: string }).kind ?? "task") as string) === "part_instance"
        ? "ready"
        : "complete"),
    dependencyType:
      (dependency as { dependencyType?: string }).dependencyType === "soft" ? "soft" : "hard",
    createdAt: (dependency as { createdAt?: string }).createdAt ?? new Date().toISOString(),
  }));
}
