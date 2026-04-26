import type { BootstrapPayload, EventRecord } from "@/types";

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}

export function getEventProjectIds(
  event: Pick<EventRecord, "projectIds" | "relatedSubsystemIds">,
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  const explicitProjectIds = Array.isArray(event.projectIds)
    ? uniqueIds(event.projectIds)
    : [];

  if (explicitProjectIds.length > 0) {
    return explicitProjectIds;
  }

  return uniqueIds(
    event.relatedSubsystemIds.map(
      (subsystemId) => subsystemsById[subsystemId]?.projectId,
    ),
  );
}

export function getMilestoneSubsystemOptions(
  subsystems: BootstrapPayload["subsystems"],
  selectedProjectIds: string[],
) {
  if (selectedProjectIds.length === 0) {
    return subsystems;
  }

  const selectedProjectIdsSet = new Set(selectedProjectIds);
  return subsystems.filter((subsystem) => selectedProjectIdsSet.has(subsystem.projectId));
}

export function reconcileMilestoneSubsystemIds(
  relatedSubsystemIds: string[],
  selectedProjectIds: string[],
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>,
) {
  if (selectedProjectIds.length === 0) {
    return uniqueIds(relatedSubsystemIds);
  }

  const selectedProjectIdsSet = new Set(selectedProjectIds);
  return uniqueIds(
    relatedSubsystemIds.filter((subsystemId) => {
      const subsystem = subsystemsById[subsystemId];
      return subsystem ? selectedProjectIdsSet.has(subsystem.projectId) : false;
    }),
  );
}
