import type { TaskDependencyRecord } from "@/types/recordsExecution";

type DependencyInput = TaskDependencyRecord & { taskId?: string; workItemId?: string };

export function normalizeTaskDependencies(source: readonly DependencyInput[] = []): TaskDependencyRecord[] {
  return source.map((dependency) => {
    const legacyTaskOwner = !dependency.workItemId && Boolean(dependency.taskId);
    const ownerType = dependency.sourceType ?? "task";
    return {
      ...dependency,
      workItemId: dependency.workItemId ?? dependency.taskId ?? "",
      sourceType: ownerType,
      kind: dependency.kind === "task" ? "work_item" : dependency.kind,
      refType: dependency.kind === "task" ? "task" : dependency.refType ?? (legacyTaskOwner ? undefined : dependency.kind === "work_item" ? "task" : undefined),
    };
  });
}
