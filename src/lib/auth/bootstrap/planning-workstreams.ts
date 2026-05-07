import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import type { WorkstreamRecord } from "@/types/recordsOrganization";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
import {
  isIsoDate,
  resolveProjectAlias,
  toNumberOrZero,
  uniqueIds,
  type LegacyBootstrapPayload,
} from "./shared";
import type { NormalizedPlanningProjects } from "./planning-projects";

export interface NormalizedPlanningWorkstreams {
  workstreams: WorkstreamRecord[];
  tasks: TaskRecord[];
  taskDependencies: TaskDependencyRecord[];
}

export function normalizePlanningWorkstreams(
  source: LegacyBootstrapPayload,
  planningProjects: NormalizedPlanningProjects,
  startDate: string,
): NormalizedPlanningWorkstreams {
  const sourceWorkstreams = source.workstreams ?? [];
  const sourceSubsystems = source.subsystems ?? [];
  const sourceDisciplines = source.disciplines ?? [];
  const sourceTasks = source.tasks ?? [];

  const subsystemById = new Map(sourceSubsystems.map((subsystem) => [subsystem.id, subsystem]));
  const inferredWorkstreamBySubsystemId = new Map<string, string>();

  let workstreams: WorkstreamRecord[] = sourceWorkstreams.map((workstream, index) => ({
    id: workstream.id ?? `workstream-${index + 1}`,
    projectId:
      resolveProjectAlias(
        workstream.projectId,
        planningProjects.projectIds,
        planningProjects.projectIdAliases,
      ) ?? planningProjects.defaultProjectId,
    name: workstream.name ?? `Workstream ${index + 1}`,
    color: resolveWorkspaceColor(
      workstream.color,
      `${workstream.projectId ?? planningProjects.defaultProjectId}:${workstream.id ?? workstream.name ?? index}`,
      index,
    ),
    description: workstream.description ?? "",
    isArchived: workstream.isArchived ?? false,
  }));

  if (workstreams.length === 0) {
    const subsystemIds = Array.from(
      new Set([
        ...sourceSubsystems.map((subsystem) => subsystem.id),
        ...sourceTasks
          .map((task) => task.subsystemId)
          .filter(
            (subsystemId): subsystemId is string =>
              typeof subsystemId === "string" && subsystemId.length > 0,
          ),
      ]),
    );

    workstreams = subsystemIds.map((subsystemId, index) => {
      const subsystem = subsystemById.get(subsystemId);
      const workstreamId = `workstream-${subsystemId}`;
      inferredWorkstreamBySubsystemId.set(subsystemId, workstreamId);

      return {
        id: workstreamId,
        projectId: planningProjects.defaultProjectId,
        name: subsystem?.name ?? `Workstream ${index + 1}`,
        color: resolveWorkspaceColor(
          subsystem?.color,
          `${planningProjects.defaultProjectId}:${subsystemId}:${subsystem?.name ?? index}`,
          index,
        ),
        description: subsystem?.description ?? "",
        isArchived: false,
      };
    });
  } else {
    sourceSubsystems.forEach((subsystem) => {
      const matchingWorkstream = workstreams.find(
        (workstream) => workstream.name.toLowerCase() === subsystem.name.toLowerCase(),
      );

      if (matchingWorkstream) {
        inferredWorkstreamBySubsystemId.set(subsystem.id, matchingWorkstream.id);
      }
    });
  }

  const workstreamIds = new Set(workstreams.map((workstream) => workstream.id));
  const defaultSubsystemId = sourceSubsystems[0]?.id ?? "";
  const defaultDisciplineId = sourceDisciplines[0]?.id ?? "";

  const tasks: TaskRecord[] = sourceTasks.map((task, index) => {
    const taskProjectId =
      resolveProjectAlias(task.projectId, planningProjects.projectIds, planningProjects.projectIdAliases) ??
      planningProjects.defaultProjectId;
    const taskSubsystemId =
      typeof task.subsystemId === "string" && task.subsystemId.length > 0
        ? task.subsystemId
        : defaultSubsystemId;
    const inferredWorkstreamId = taskSubsystemId
      ? inferredWorkstreamBySubsystemId.get(taskSubsystemId) ?? null
      : null;
    const taskWorkstreamId =
      typeof task.workstreamId === "string" && workstreamIds.has(task.workstreamId)
        ? task.workstreamId
        : inferredWorkstreamId;
    const taskWorkstreamIds =
      Array.isArray(task.workstreamIds) && task.workstreamIds.length > 0
        ? uniqueIds(task.workstreamIds.filter((workstreamId) => workstreamIds.has(workstreamId)))
        : uniqueIds([taskWorkstreamId]);
    const taskStartDate = isIsoDate(task.startDate) ? task.startDate : startDate;
    const taskDueDate = isIsoDate(task.dueDate) ? task.dueDate : taskStartDate;
    const taskMechanismIds = Array.isArray(task.mechanismIds)
      ? uniqueIds(task.mechanismIds)
      : uniqueIds([task.mechanismId]);
    const taskPartInstanceIds = Array.isArray(task.partInstanceIds)
      ? uniqueIds(task.partInstanceIds)
      : uniqueIds([task.partInstanceId]);
    const taskArtifactIds = Array.isArray(task.artifactIds)
      ? uniqueIds(task.artifactIds)
      : uniqueIds([task.artifactId]);
    const taskAssigneeIds = Array.isArray(task.assigneeIds)
      ? uniqueIds(task.assigneeIds)
      : uniqueIds([task.ownerId]);

    return {
      id: task.id ?? `task-${index + 1}`,
      projectId: taskProjectId,
      workstreamId: taskWorkstreamId,
      workstreamIds: taskWorkstreamIds,
      title: task.title ?? "Untitled task",
      summary: task.summary ?? "",
      subsystemId: taskSubsystemId,
      subsystemIds:
        Array.isArray(task.subsystemIds) && task.subsystemIds.length > 0
          ? uniqueIds(task.subsystemIds)
          : uniqueIds([taskSubsystemId]),
      disciplineId: task.disciplineId ?? defaultDisciplineId,
      mechanismId: taskMechanismIds[0] ?? null,
      mechanismIds: taskMechanismIds,
      partInstanceId: taskPartInstanceIds[0] ?? null,
      partInstanceIds: taskPartInstanceIds,
      artifactId: taskArtifactIds[0] ?? null,
      artifactIds: taskArtifactIds,
      targetMilestoneId: task.targetMilestoneId ?? null,
      ownerId: task.ownerId ?? null,
      assigneeIds: taskAssigneeIds,
      mentorId: task.mentorId ?? null,
      startDate: taskStartDate,
      dueDate: taskDueDate,
      priority: task.priority ?? "medium",
      status: task.status ?? "not-started",
      dependencyIds: task.dependencyIds ?? [],
      blockers: task.blockers ?? [],
      isBlocked: (task.blockers ?? []).length > 0,
      linkedManufacturingIds: task.linkedManufacturingIds ?? [],
      linkedPurchaseIds: task.linkedPurchaseIds ?? [],
      estimatedHours: toNumberOrZero(task.estimatedHours),
      actualHours: toNumberOrZero(task.actualHours),
      requiresDocumentation: task.requiresDocumentation ?? false,
      documentationLinked: task.documentationLinked ?? false,
    };
  });

  const normalizedDependencies = (source.taskDependencies ?? []).map((dependency, index) => {
    const dependencyRecord = dependency as {
      id?: string;
      kind?: "task" | "milestone" | "part_instance" | "milestone";
      refId?: string;
      taskId?: string;
      upstreamTaskId?: string;
      downstreamTaskId?: string;
      requiredState?: string;
      dependencyType?: "hard" | "soft" | "blocks" | "finish_to_start";
      createdAt?: string;
    };
    const kind = dependencyRecord.kind ?? "task";
    const dependencyType: TaskDependencyRecord["dependencyType"] =
      dependencyRecord.dependencyType === "soft" ? "soft" : "hard";
    const refId = dependencyRecord.refId ?? dependencyRecord.upstreamTaskId ?? "";
    const taskId = dependencyRecord.taskId ?? dependencyRecord.downstreamTaskId ?? "";

    return {
      id: dependencyRecord.id ?? `task-dependency-${index + 1}`,
      taskId,
      kind,
      refId,
      requiredState:
        dependencyRecord.requiredState ?? (kind === "part_instance" ? "ready" : "complete"),
      dependencyType,
      createdAt: dependencyRecord.createdAt ?? new Date().toISOString(),
    };
  });

  const dependencyIdsByTaskId = new Map<string, string[]>();
  normalizedDependencies.forEach((dependency) => {
    if (dependency.kind !== "task" || dependency.dependencyType === "soft" || !dependency.taskId) {
      return;
    }

    const current = dependencyIdsByTaskId.get(dependency.taskId) ?? [];
    current.push(dependency.refId);
    dependencyIdsByTaskId.set(dependency.taskId, current);
  });

  const blockerDescriptionsByTaskId = new Map<string, string[]>();
  (source.taskBlockers ?? []).forEach((blocker) => {
    if (blocker.status === "resolved" || !blocker.blockedTaskId) {
      return;
    }

    const current = blockerDescriptionsByTaskId.get(blocker.blockedTaskId) ?? [];
    current.push(blocker.description ?? "");
    blockerDescriptionsByTaskId.set(blocker.blockedTaskId, current);
  });

  const normalizedTasks = tasks.map((task) => {
    const dependencyIds =
      task.dependencyIds.length > 0
        ? uniqueIds(task.dependencyIds)
        : dependencyIdsByTaskId.get(task.id) ?? [];
    const blockers =
      task.blockers.length > 0
        ? uniqueIds(task.blockers)
        : blockerDescriptionsByTaskId.get(task.id) ?? [];

    return {
      ...task,
      dependencyIds,
      blockers,
      isBlocked: blockers.length > 0,
    };
  });

  return {
    workstreams,
    tasks: normalizedTasks,
    taskDependencies: normalizedDependencies,
  };
}
