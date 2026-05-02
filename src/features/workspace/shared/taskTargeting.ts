import type {
  BootstrapPayload,
  TaskDependencyKind,
  TaskPayload,
  TaskRecord,
} from "@/types";
import {
  getTaskDependencyRecordsForTask as getTaskDependencyRecordsForTaskFromPlanning,
  getTaskOpenBlockersForTask as getTaskOpenBlockersForTaskFromPlanning,
  getTaskWaitingOnDependencies as getTaskWaitingOnDependenciesFromPlanning,
} from "./taskPlanning";

export type TaskTargetKind = "workstream" | "subsystem" | "mechanism" | "part-instance";

export interface TaskTargetSelection {
  kind: TaskTargetKind;
  id: string;
}

type TaskSelectionPayload = Pick<
  TaskPayload,
  "subsystemId" | "subsystemIds" | "mechanismId" | "mechanismIds" | "partInstanceId" | "partInstanceIds"
>;

type SelectionLookups = {
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
};

type TaskDependencyTargetLookups = {
  tasksById: Record<string, TaskRecord>;
  eventsById: Record<string, BootstrapPayload["events"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  formatIterationVersion: (value: number | null | undefined) => string;
};

type TaskScopeChip = {
  key: string;
  label: string;
};

export const TASK_DEPENDENCY_KIND_LABELS: Record<TaskDependencyKind, string> = {
  task: "Task",
  milestone: "Milestone",
  part_instance: "Part instance",
  event: "Event",
};

export const TASK_DEPENDENCY_TYPE_LABELS = {
  hard: "Hard",
  soft: "Soft",
} as const;

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function removeId(ids: string[], id: string) {
  return ids.filter((currentId) => currentId !== id);
}

function getTaskTargetArrays(payload: TaskSelectionPayload) {
  return {
    subsystemIds: payload.subsystemIds.length ? payload.subsystemIds : uniqueIds([payload.subsystemId]),
    mechanismIds: payload.mechanismIds.length ? payload.mechanismIds : uniqueIds([payload.mechanismId]),
    partInstanceIds: payload.partInstanceIds.length
      ? payload.partInstanceIds
      : uniqueIds([payload.partInstanceId]),
  };
}

function normalizeTaskTargetPayload(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  targets: {
    subsystemIds: string[];
    mechanismIds: string[];
    partInstanceIds: string[];
  },
) {
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;
  let subsystemIds = uniqueIds(targets.subsystemIds);
  let mechanismIds = uniqueIds(targets.mechanismIds);
  const partInstanceIds = uniqueIds(targets.partInstanceIds);

  mechanismIds.forEach((mechanismId) => {
    const mechanism = mechanismsById[mechanismId];

    if (mechanism) {
      subsystemIds = uniqueIds([...subsystemIds, mechanism.subsystemId]);
    }
  });

  partInstanceIds.forEach((partInstanceId) => {
    const partInstance = partInstancesById[partInstanceId];

    if (!partInstance) {
      return;
    }

    subsystemIds = uniqueIds([...subsystemIds, partInstance.subsystemId]);

    if (partInstance.mechanismId) {
      mechanismIds = uniqueIds([...mechanismIds, partInstance.mechanismId]);
    }
  });

  const normalizedSubsystemIds = uniqueIds(subsystemIds);
  const normalizedMechanismIds = uniqueIds(mechanismIds);
  const normalizedPartInstanceIds = uniqueIds(partInstanceIds);

  return {
    ...payload,
    workstreamId: null,
    workstreamIds: [],
    subsystemId: normalizedSubsystemIds[0] ?? "",
    subsystemIds: normalizedSubsystemIds,
    mechanismId: normalizedMechanismIds[0] ?? null,
    mechanismIds: normalizedMechanismIds,
    partInstanceId: normalizedPartInstanceIds[0] ?? null,
    partInstanceIds: normalizedPartInstanceIds,
  } as TaskPayload;
}

export function getTaskTargetGroupLabel(project: Pick<BootstrapPayload["projects"][number], "projectType"> | null | undefined) {
  return project?.projectType === "robot" ? "Subsystems" : "Workstreams";
}

export function getTaskSelectedPrimaryTargetIds(payload: TaskSelectionPayload) {
  return payload.subsystemIds.length > 0
    ? payload.subsystemIds
    : payload.subsystemId
      ? [payload.subsystemId]
      : [];
}

export function getTaskSelectedPrimaryTargetId(payload: TaskSelectionPayload) {
  return getTaskSelectedPrimaryTargetIds(payload)[0] ?? "";
}

export function getTaskSelectedMechanismIds(payload: Pick<TaskPayload, "mechanismId" | "mechanismIds">) {
  return payload.mechanismIds.length > 0 ? payload.mechanismIds : payload.mechanismId ? [payload.mechanismId] : [];
}

export function getTaskSelectedPartInstanceIds(
  payload: Pick<TaskPayload, "partInstanceId" | "partInstanceIds">,
) {
  return payload.partInstanceIds.length > 0
    ? payload.partInstanceIds
    : payload.partInstanceId
      ? [payload.partInstanceId]
      : [];
}

export function getTaskSelectedAssigneeIds(
  payload: Pick<TaskPayload, "assigneeIds" | "ownerId">,
) {
  return payload.assigneeIds.length > 0 ? payload.assigneeIds : payload.ownerId ? [payload.ownerId] : [];
}

export function getTaskPrimaryTargetName(
  selectedPrimaryTargetId: string,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  return selectedPrimaryTargetId ? subsystemsById[selectedPrimaryTargetId]?.name ?? "" : "";
}

export function getTaskPrimaryTargetNameOptions(
  projectSubsystems: BootstrapPayload["subsystems"],
) {
  return Array.from(new Set(projectSubsystems.map((subsystem) => subsystem.name)));
}

export function getTaskSelectedScopeChips(
  payload: Pick<TaskPayload, "mechanismId" | "mechanismIds" | "partInstanceId" | "partInstanceIds">,
  lookups: SelectionLookups & {
    partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
    formatIterationVersion: (value: number | null | undefined) => string;
  },
): TaskScopeChip[] {
  const mechanismIds = getTaskSelectedMechanismIds(payload);
  const partInstanceIds = getTaskSelectedPartInstanceIds(payload);

  return [
    ...mechanismIds.map((id) => {
      const mechanism = lookups.mechanismsById[id];
      if (!mechanism) {
        return null;
      }

      return {
        key: `mechanism-${id}`,
        label: `${mechanism.name} (${lookups.formatIterationVersion(mechanism.iteration)})`,
      };
    }),
    ...partInstanceIds.map((id) => {
      const partInstance = lookups.partInstancesById[id];
      if (!partInstance) {
        return null;
      }

      const partDefinition = lookups.partDefinitionsById[partInstance.partDefinitionId];
      return {
        key: `part-instance-${id}`,
        label: partDefinition
          ? `${partInstance.name} (${partDefinition.name} (${lookups.formatIterationVersion(partDefinition.iteration)}))`
          : partInstance.name,
      };
    }),
  ].filter((chip): chip is TaskScopeChip => Boolean(chip));
}

export function getTaskDependencyTargetName(
  dependencyKind: TaskDependencyKind,
  refId: string,
  lookups: TaskDependencyTargetLookups,
) {
  if (dependencyKind === "task") {
    return lookups.tasksById[refId]?.title ?? "Unknown task";
  }

  if (dependencyKind === "milestone" || dependencyKind === "event") {
    return lookups.eventsById[refId]?.title ?? "Unknown milestone";
  }

  const partInstance = lookups.partInstancesById[refId];
  if (!partInstance) {
    return "Unknown part";
  }

  const partDefinition = lookups.partDefinitionsById[partInstance.partDefinitionId];
  if (!partDefinition) {
    return partInstance.name;
  }

  return `${partInstance.name} (${partDefinition.name} (${lookups.formatIterationVersion(partDefinition.iteration)}))`;
}

export function getTaskDependencyRecordsForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskDependencyRecordsForTaskFromPlanning(taskId, bootstrap);
}

export function getTaskOpenBlockersForTask(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskOpenBlockersForTaskFromPlanning(taskId, bootstrap);
}

export function getTaskWaitingOnDependencies(taskId: string, bootstrap: BootstrapPayload) {
  return getTaskWaitingOnDependenciesFromPlanning(taskId, bootstrap);
}

export function setTaskPrimaryTargetSelection(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  subsystemId: string,
): TaskPayload {
  const selectedSubsystem = bootstrap.subsystems.find((subsystem) => subsystem.id === subsystemId);
  if (!selectedSubsystem) {
    return normalizeTaskTargetPayload(payload, bootstrap, {
      subsystemIds: [],
      mechanismIds: [],
      partInstanceIds: [],
    });
  }

  const mechanismIds = payload.mechanismIds.filter((mechanismId) =>
    bootstrap.mechanisms.some(
      (mechanism) => mechanism.id === mechanismId && mechanism.subsystemId === selectedSubsystem.id,
    ),
  );
  const partInstanceIds = payload.partInstanceIds.filter((partInstanceId) =>
    bootstrap.partInstances.some(
      (partInstance) => partInstance.id === partInstanceId && partInstance.subsystemId === selectedSubsystem.id,
    ),
  );

  return normalizeTaskTargetPayload(payload, bootstrap, {
    subsystemIds: [selectedSubsystem.id],
    mechanismIds,
    partInstanceIds,
  });
}

export function toggleTaskTargetSelection(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  selection: TaskTargetSelection,
): TaskPayload {
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;

  let { subsystemIds, mechanismIds, partInstanceIds } = getTaskTargetArrays(payload);

  if (selection.kind === "workstream" || selection.kind === "subsystem") {
    if (subsystemIds.includes(selection.id)) {
      const removedMechanismIds = new Set(
        bootstrap.mechanisms
          .filter((mechanism) => mechanism.subsystemId === selection.id)
          .map((mechanism) => mechanism.id),
      );

      subsystemIds = removeId(subsystemIds, selection.id);
      mechanismIds = mechanismIds.filter(
        (mechanismId) => mechanismsById[mechanismId]?.subsystemId !== selection.id,
      );
      partInstanceIds = partInstanceIds.filter((partInstanceId) => {
        const partInstance = partInstancesById[partInstanceId];

        return Boolean(
          partInstance &&
            partInstance.subsystemId !== selection.id &&
            (!partInstance.mechanismId || !removedMechanismIds.has(partInstance.mechanismId)),
        );
      });
    } else {
      subsystemIds = uniqueIds([...subsystemIds, selection.id]);
    }
  }

  if (selection.kind === "mechanism") {
    const mechanism = mechanismsById[selection.id];

    if (!mechanism) {
      return payload;
    }

    if (mechanismIds.includes(selection.id)) {
      mechanismIds = removeId(mechanismIds, selection.id);
      partInstanceIds = partInstanceIds.filter(
        (partInstanceId) => partInstancesById[partInstanceId]?.mechanismId !== selection.id,
      );
    } else {
      mechanismIds = uniqueIds([...mechanismIds, selection.id]);
      subsystemIds = uniqueIds([...subsystemIds, mechanism.subsystemId]);
    }
  }

  if (selection.kind === "part-instance") {
    const partInstance = partInstancesById[selection.id];

    if (!partInstance) {
      return payload;
    }

    if (partInstanceIds.includes(selection.id)) {
      partInstanceIds = removeId(partInstanceIds, selection.id);
    } else {
      partInstanceIds = uniqueIds([...partInstanceIds, selection.id]);
      subsystemIds = uniqueIds([...subsystemIds, partInstance.subsystemId]);

      if (partInstance.mechanismId) {
        mechanismIds = uniqueIds([...mechanismIds, partInstance.mechanismId]);
      }
    }
  }

  return normalizeTaskTargetPayload(payload, bootstrap, {
    subsystemIds,
    mechanismIds,
    partInstanceIds,
  });
}
