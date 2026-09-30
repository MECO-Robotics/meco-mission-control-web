import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";

const record = <T>(value: Partial<T>) => value as T;

export function createScopeBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    seasons: ["season-1", "season-2"].map((id) => record<BootstrapPayload["seasons"][number]>({ id })),
    projects: [
      ["project-visible", "season-1"], ["project-hidden", "season-1"], ["project-season-2", "season-2"],
    ].map(([id, seasonId]) => record<BootstrapPayload["projects"][number]>({ id, seasonId })),
    subsystems: [
      ["subsystem-visible", "project-visible"], ["subsystem-hidden", "project-hidden"],
      ["subsystem-season-2", "project-season-2"],
    ].map(([id, projectId]) => record<BootstrapPayload["subsystems"][number]>({ id, projectId })),
    mechanisms: [
      ["mechanism-visible", "subsystem-visible"], ["mechanism-hidden", "subsystem-hidden"],
    ].map(([id, subsystemId]) => record<BootstrapPayload["mechanisms"][number]>({ id, subsystemId })),
    partInstances: [
      ["part-visible", "subsystem-visible", "mechanism-visible"],
      ["part-hidden-subsystem", "subsystem-hidden", "mechanism-hidden"],
      ["part-hidden-mechanism", "subsystem-visible", "mechanism-hidden"],
    ].map(([id, subsystemId, mechanismId]) => record<BootstrapPayload["partInstances"][number]>({ id, subsystemId, mechanismId })),
    milestones: ([
      ["milestone-visible", ["project-visible"]], ["milestone-hidden", ["project-hidden"]],
      ["milestone-global", []],
    ] as const).map(([id, projectIds]) => record<BootstrapPayload["milestones"][number]>({ id, projectIds: [...projectIds] })),
    tasks: ([
      ["task-visible", "project-visible", "subsystem-visible"],
      ["task-hidden", "project-hidden", "subsystem-hidden"],
      ["task-season-2", "project-season-2", "subsystem-season-2"],
    ] as const).map(([id, projectId, subsystemId]) => record<BootstrapPayload["tasks"][number]>({ id, projectId, subsystemIds: [subsystemId] })),
    taskDependencies: ([
      ["dep-hidden-task", "task-hidden", "work_item", "task-hidden"],
      ["dep-global-milestone", "task-visible", "milestone", "milestone-global"],
      ["dep-hidden-milestone", "task-visible", "milestone", "milestone-hidden"],
      ["dep-visible-part", "task-visible", "part_instance", "part-visible"],
      ["dep-hidden-part", "task-visible", "part_instance", "part-hidden-subsystem"],
    ] as const).map(([id, taskId, kind, refId]) => record<NonNullable<BootstrapPayload["taskDependencies"]>[number]>({ id, workItemId: taskId, sourceType: "task", kind, refType: kind === "work_item" ? "task" : undefined, refId })),
    taskBlockers: ([
      ["blocker-task", "task-hidden", "other", "task"],
      ["blocker-milestone", "milestone-hidden", "design-issue", "milestone"],
      ["blocker-part", "part-hidden-subsystem", "lost-part", "part"],
      ["blocker-external", "vendor-order-42", "shipping-delay", "external"],
    ] as const).map(([id, blockerId, blockerType, sourceKind]) => record<NonNullable<BootstrapPayload["taskBlockers"]>[number]>({
      id, blockedTaskId: "task-visible", blockerId, blockerType, sourceKind,
    })),
    workLogs: ["task-visible", "task-hidden"].map((taskId, index) =>
      record<BootstrapPayload["workLogs"][number]>({ id: `worklog-${index}`, taskId })),
    meetings: ([
      ["meeting-visible", "season-1", ["project-visible"]],
      ["meeting-hidden", "season-1", ["project-hidden"]],
      ["meeting-global", "season-1", []], ["meeting-season-2", "season-2", ["project-season-2"]],
    ] as const).map(([id, seasonId, projectIds]) => record<NonNullable<BootstrapPayload["meetings"]>[number]>({
      id, seasonId, projectIds: [...projectIds],
    })),
  };
}

export const ids = <T extends { id: string }>(records: T[] | undefined) => records?.map(({ id }) => id) ?? [];
