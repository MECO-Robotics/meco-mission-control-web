import type { BootstrapPayload } from "@/types/bootstrap";
import type { MembersById } from "@/features/workspace/shared/model/workspaceTypes";
import { formatIterationVersion, getDefaultSubsystemId } from "@/lib/appUtils/common";

import type { SubsystemCountsById } from "./subsystemsViewTypes";

export function formatMemberName(membersById: MembersById, memberId: string | null) {
  if (!memberId) {
    return "Unassigned";
  }

  return membersById[memberId]?.name ?? "Unknown";
}

export function getInitialSelectedSubsystemId(bootstrap: BootstrapPayload) {
  return getDefaultSubsystemId(bootstrap);
}

export function buildCountsBySubsystemId(
  bootstrap: BootstrapPayload,
  showArchivedMechanisms: boolean,
): SubsystemCountsById {
  const countsBySubsystemId = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [
      subsystem.id,
      {
        mechanisms: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
      },
    ]),
  ) as SubsystemCountsById;

  for (const mechanism of bootstrap.mechanisms) {
    if (!showArchivedMechanisms && mechanism.isArchived) {
      continue;
    }
    countsBySubsystemId[mechanism.subsystemId] = countsBySubsystemId[mechanism.subsystemId] ?? {
      mechanisms: 0,
      parts: 0,
      tasks: 0,
      openTasks: 0,
    };
    countsBySubsystemId[mechanism.subsystemId].mechanisms += 1;
  }

  for (const partInstance of bootstrap.partInstances) {
    countsBySubsystemId[partInstance.subsystemId] = countsBySubsystemId[partInstance.subsystemId] ?? {
      mechanisms: 0,
      parts: 0,
      tasks: 0,
      openTasks: 0,
    };
    countsBySubsystemId[partInstance.subsystemId].parts += 1;
  }

  for (const task of bootstrap.tasks) {
    for (const subsystemId of task.subsystemIds) {
      countsBySubsystemId[subsystemId] = countsBySubsystemId[subsystemId] ?? {
        mechanisms: 0,
        parts: 0,
        tasks: 0,
        openTasks: 0,
      };
      countsBySubsystemId[subsystemId].tasks += 1;
      if (task.status !== "complete") {
        countsBySubsystemId[subsystemId].openTasks += 1;
      }
    }
  }

  return countsBySubsystemId;
}

export function buildPartDefinitionsById(bootstrap: BootstrapPayload) {
  return Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
}

export function filterSubsystems(params: {
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  search: string;
  showArchivedMechanisms: boolean;
  showArchivedSubsystems: boolean;
}) {
  const {
    bootstrap,
    membersById,
    partDefinitionsById,
    search,
    showArchivedMechanisms,
    showArchivedSubsystems,
  } = params;
  const normalizedSearch = search.trim().toLowerCase();

  return [...bootstrap.subsystems].filter((subsystem) => {
    if (!showArchivedSubsystems && subsystem.isArchived) {
      return false;
    }

    const parentSubsystem = subsystem.parentSubsystemId
      ? bootstrap.subsystems.find((candidate) => candidate.id === subsystem.parentSubsystemId)
      : null;
    const relatedMechanisms = bootstrap.mechanisms
      .filter((mechanism) => (showArchivedMechanisms ? true : !mechanism.isArchived))
      .filter((mechanism) => mechanism.subsystemId === subsystem.id)
      .map((mechanism) => mechanism.name)
      .join(" ");
    const relatedTasks = bootstrap.tasks
      .filter((task) => task.subsystemId === subsystem.id || task.subsystemIds.includes(subsystem.id))
      .map((task) => `${task.title} ${task.summary}`)
      .join(" ");
    const relatedPartInstances = bootstrap.partInstances
      .filter((partInstance) => partInstance.subsystemId === subsystem.id)
      .map((partInstance) => {
        const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
        return `${partInstance.name} ${partDefinition?.name ?? ""}`;
      })
      .join(" ");
    const relatedRisks = subsystem.risks.join(" ");
    const responsibleEngineer = formatMemberName(membersById, subsystem.responsibleEngineerId);
    const mentorNames = subsystem.mentorIds
      .map((mentorId) => membersById[mentorId]?.name ?? "")
      .join(" ");
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        subsystem.name,
        subsystem.description,
        `iteration ${subsystem.iteration}`,
        formatIterationVersion(subsystem.iteration),
        parentSubsystem?.name ?? "",
        responsibleEngineer,
        mentorNames,
        relatedMechanisms,
        relatedTasks,
        relatedPartInstances,
        relatedRisks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesSearch;
  });
}

export function getSubsystemMechanisms(
  bootstrap: BootstrapPayload,
  subsystemId: string,
  showArchivedMechanisms: boolean,
) {
  return [...bootstrap.mechanisms]
    .filter((mechanism) => mechanism.subsystemId === subsystemId)
    .filter((mechanism) => (showArchivedMechanisms ? true : !mechanism.isArchived))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function getSubsystemParentName(
  bootstrap: BootstrapPayload,
  parentSubsystemId: string | null,
) {
  if (!parentSubsystemId) {
    return "Root subsystem";
  }

  return (
    bootstrap.subsystems.find((candidate) => candidate.id === parentSubsystemId)?.name ?? "Unknown"
  );
}
