import type { LegacyTaskDependencyRecord, TaskDependencyRecord } from "@/types/recordsExecution";

export function normalizeTaskDependencies(source: Array<TaskDependencyRecord | LegacyTaskDependencyRecord> = []): TaskDependencyRecord[] {
  return source.map((dependency) => {
    if ("workItemId" in dependency) return dependency;
    return {
      id: dependency.id,
      workItemId: dependency.taskId,
      sourceType: "task",
      kind: dependency.kind === "task" ? "work_item" : dependency.kind,
      refType: dependency.kind === "task" ? "task" : undefined,
      refId: dependency.refId,
      requiredState: dependency.requiredState,
      dependencyType: dependency.dependencyType,
      createdAt: dependency.createdAt,
    };
  });
}
