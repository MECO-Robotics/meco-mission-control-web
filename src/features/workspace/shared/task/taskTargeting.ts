import { createElement } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyKind } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconMapPin, IconParts, IconTasks } from "@/components/shared/Icons";
import type { DropdownOption } from "../model/workspaceTypes";
import {
  getTaskDependencyRecordsForTask as getTaskDependencyRecordsForTaskFromPlanning,
  getTaskOpenBlockersForTask as getTaskOpenBlockersForTaskFromPlanning,
  getTaskWaitingOnDependencies as getTaskWaitingOnDependenciesFromPlanning,
} from "./taskPlanning";
import {
  getTaskTargetArrays,
  normalizeTaskTargetPayload,
  removeId,
} from "./taskTargetingHelpers";

export type TaskTargetKind = "workstream" | "subsystem" | "mechanism" | "part-instance";

export interface TaskTargetSelection {
  kind: TaskTargetKind;
  id: string;
}

type SelectionLookups = {
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
};

type TaskDependencyTargetLookups = {
  tasksById: Record<string, TaskRecord>;
  milestonesById: Record<string, BootstrapPayload["milestones"][number]>;
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
};

export const TASK_DEPENDENCY_KIND_OPTIONS: DropdownOption[] = (
  Object.entries(TASK_DEPENDENCY_KIND_LABELS) as Array<[TaskDependencyKind, string]>
)
  .map(([kind, label]) => ({
    id: kind,
    name: label,
    icon: getDependencyKindIcon(kind),
  }));

type DependencyTargetLookups = TaskDependencyTargetLookups;

function getDependencyKindIcon(kind: TaskDependencyKind) {
  switch (kind) {
    case "task":
      return createElement(IconTasks);
    case "milestone":
      return createElement(IconMapPin);
    case "part_instance":
      return createElement(IconParts);
  }
}

export const TASK_DEPENDENCY_TYPE_LABELS = {
  hard: "Hard",
  soft: "Soft",
} as const;

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function getTaskTargetGroupLabel(project: Pick<BootstrapPayload["projects"][number], "projectType"> | null | undefined) {
  return project?.projectType === "robot" ? "Subsystems" : "Workstreams";
}

export function getTaskSelectedPrimaryTargetIds(
  payload: Pick<TaskPayload, "subsystemId" | "subsystemIds">,
) {
  return payload.subsystemIds.length > 0
    ? payload.subsystemIds
    : payload.subsystemId
      ? [payload.subsystemId]
      : [];
}

export function getTaskSelectedPrimaryTargetId(
  payload: Pick<TaskPayload, "subsystemId" | "subsystemIds">,
) {
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

  if (dependencyKind === "milestone") {
    return lookups.milestonesById[refId]?.title ?? "Unknown milestone";
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

export function getTaskDependencyTargetOptions(
  dependencyKind: TaskDependencyKind,
  lookups: DependencyTargetLookups,
) {
  if (dependencyKind === "task") {
    return Object.values(lookups.tasksById)
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((task) => ({
        id: task.id,
        name: task.title,
        icon: createElement(IconTasks),
      }));
  }

  if (dependencyKind === "milestone") {
    return Object.values(lookups.milestonesById)
      .sort((left, right) => left.title.localeCompare(right.title))
      .map((milestone) => ({
        id: milestone.id,
        name: milestone.title,
        icon: createElement(IconMapPin),
      }));
  }

  return Object.values(lookups.partInstancesById).map((partInstance) => ({
    id: partInstance.id,
    name: partInstance.name,
    icon: createElement(IconParts),
  }));
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
