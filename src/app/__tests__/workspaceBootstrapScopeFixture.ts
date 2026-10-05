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
    ].map(([id, subsystemId, mechanismId]) => record<BootstrapPayload["partInstances"][number]>({
      id,
      partDefinitionId: `definition-${id}`,
      intendedSubsystemId: subsystemId,
      intendedMechanismId: mechanismId,
      location: { kind: "stock", location: "robotics lab" },
    })),
    milestones: ([
      ["milestone-visible", ["project-visible"]], ["milestone-hidden", ["project-hidden"]],
      ["milestone-global", []],
    ] as const).map(([id, projectIds]) => record<BootstrapPayload["milestones"][number]>({ id, seasonId: "season-1", projectIds: [...projectIds] })),
    tasks: ([
      ["task-visible", "project-visible", "subsystem-visible"],
      ["task-hidden", "project-hidden", "subsystem-hidden"],
      ["task-season-2", "project-season-2", "subsystem-season-2"],
    ] as const).map(([id, projectId, subsystemId]) => record<BootstrapPayload["tasks"][number]>({ id, projectId, subsystemIds: [subsystemId] })),
    taskDependencies: ([
      ["dep-hidden-task", "task-hidden", "task", "task-hidden"],
      ["dep-global-milestone", "task-visible", "milestone", "milestone-global"],
      ["dep-hidden-milestone", "task-visible", "milestone", "milestone-hidden"],
      ["dep-visible-part", "task-visible", "part-instance", "part-visible"],
      ["dep-hidden-part", "task-visible", "part-instance", "part-hidden-subsystem"],
    ] as const).map(([id, taskId, kind, refId]) => record<NonNullable<BootstrapPayload["taskDependencies"]>[number]>({ id, taskId, kind, refId })),
    risks: ([
      { id: "risk-visible", relatedTargets: [{ kind: "project", id: "project-visible" }] },
      { id: "risk-hidden", relatedTargets: [{ kind: "project", id: "project-hidden" }] },
    ] as const).map((risk) => record<BootstrapPayload["risks"][number]>({
      projectId: risk.relatedTargets[0]!.id,
      title: risk.id,
      detail: "Unresolved project risk",
      category: "other",
      severity: "medium",
      status: "open",
      blocksWork: false,
      source: { kind: "manual" },
      mitigationTaskId: null,
      ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
      resolvedAt: null,
      ...risk,
      relatedTargets: [...risk.relatedTargets],
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
