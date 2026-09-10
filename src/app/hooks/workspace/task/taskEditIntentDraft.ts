import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { TaskPayload } from "@/types/payloads";

function createDraftRelationId(prefix: string) {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function applyTaskEditIntentToDraft(
  taskDraft: TaskPayload,
  options?: OpenEditTaskModalOptions,
): TaskPayload {
  if (options?.intentState === "blocked") {
    return {
      ...taskDraft,
      taskBlockers: [
        ...(taskDraft.taskBlockers ?? []),
        {
          id: createDraftRelationId("blocker"),
          blockerType: "other",
          blockerId: null,
          description: "Blocked",
          isIntentPlaceholder: true,
          severity: "medium",
        },
      ],
    };
  }

  if (options?.intentState === "waiting-on-dependency") {
    return {
      ...taskDraft,
      taskDependencies: [
        ...(taskDraft.taskDependencies ?? []),
        {
          id: createDraftRelationId("dependency"),
          kind: "task",
          refId: "",
          requiredState: "complete",
          dependencyType: "hard",
        },
      ],
    };
  }

  return taskDraft;
}
