import { createElement } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyKind } from "@/types/common";
import type { TaskPayload } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconMapPin, IconParts, IconTasks } from "@/components/shared/Icons";
import type { DropdownOption } from "../model/workspaceTypes";
import {
  getTaskDependencyRecordsForTask as getTaskDependencyRecordsForTaskFromPlanning,
  getTaskOpenBlockersForTask as getTaskOpenBlockersForTaskFromPlanning,
  getTaskWaitingOnDependencies as getTaskWaitingOnDependenciesFromPlanning,
} from "./taskPlanning";
type SelectionLookups = {
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partInstancesById: Record<string, BootstrapPayload["partInstances"][number]>;
};

type TaskDependencyTargetLookups = {
  tasksById: Record<string, TaskRecord>;
  manufacturingItems?: BootstrapPayload["manufacturingItems"];
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
  work_item: "Work item",
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
    case "work_item":
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

export function getTaskSelectedPrimaryTargetId(
  payload: Pick<TaskPayload, "subsystemIds">,
) {
  return payload.subsystemIds[0] ?? "";
}

export function getTaskSelectedMechanismIds(payload: Pick<TaskPayload, "mechanismIds">) {
  return payload.mechanismIds;
}

export function getTaskSelectedPartInstanceIds(
  payload: Pick<TaskPayload, "partInstanceIds">,
) {
  return payload.partInstanceIds;
}

export function getTaskPartInstanceLabel(
  partInstance: BootstrapPayload["partInstances"][number],
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>,
  formatIterationVersion: (value: number | null | undefined) => string,
) {
  const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
  return partDefinition
    ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
    : partInstance.name;
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
  payload: Pick<TaskPayload, "mechanismIds" | "partInstanceIds">,
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

      return {
        key: `part-instance-${id}`,
        label: getTaskPartInstanceLabel(
          partInstance,
          lookups.partDefinitionsById,
          lookups.formatIterationVersion,
        ),
      };
    }),
  ].filter((chip): chip is TaskScopeChip => Boolean(chip));
}

export function getTaskDependencyTargetName(
  dependencyKind: TaskDependencyKind,
  refId: string,
  lookups: TaskDependencyTargetLookups,
) {
  if (dependencyKind === "work_item") {
    if (dependencyKind === "work_item") {
      return lookups.tasksById[refId]?.title ?? lookups.manufacturingItems?.find((item) => item.id === refId)?.title ?? "Unknown work item";
    }
    return lookups.tasksById[refId]?.title ?? "Unknown work item";
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
  if (dependencyKind === "work_item") {
    return [...Object.values(lookups.tasksById).map((task) => ({ id: task.id, name: task.title })), ...(lookups.manufacturingItems?.map((item) => ({ id: item.id, name: `Manufacturing · ${item.title}` })) ?? [])]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((task) => ({ ...task, icon: createElement(IconTasks) }));
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

export const getTaskDependencyRecordsForTask = getTaskDependencyRecordsForTaskFromPlanning;

export const getTaskOpenBlockersForTask = getTaskOpenBlockersForTaskFromPlanning;

export const getTaskWaitingOnDependencies = getTaskWaitingOnDependenciesFromPlanning;
