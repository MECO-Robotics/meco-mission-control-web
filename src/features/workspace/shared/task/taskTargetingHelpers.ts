import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";

type TaskSelectionPayload = Pick<
  TaskPayload,
  "subsystemId" | "subsystemIds" | "mechanismId" | "mechanismIds" | "partInstanceId" | "partInstanceIds"
>;

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function removeId(ids: string[], id: string) {
  return ids.filter((currentId) => currentId !== id);
}

export function getTaskTargetArrays(payload: TaskSelectionPayload) {
  return {
    subsystemIds: payload.subsystemIds.length ? payload.subsystemIds : uniqueIds([payload.subsystemId]),
    mechanismIds: payload.mechanismIds.length ? payload.mechanismIds : uniqueIds([payload.mechanismId]),
    partInstanceIds: payload.partInstanceIds.length
      ? payload.partInstanceIds
      : uniqueIds([payload.partInstanceId]),
  };
}

export function normalizeTaskTargetPayload(
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
