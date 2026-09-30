import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import { createLookupById, uniqueIds } from "../internal";

export function normalizeTaskTargetPayload(
  payload: TaskPayload,
  bootstrap: BootstrapPayload,
  targets: {
    subsystemIds: string[];
    mechanismIds: string[];
    partInstanceIds: string[];
  },
) {
  const mechanismsById = createLookupById(bootstrap.mechanisms);
  const partInstancesById = createLookupById(bootstrap.partInstances);
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
    subsystemIds: normalizedSubsystemIds,
    mechanismIds: normalizedMechanismIds,
    partInstanceIds: normalizedPartInstanceIds,
  };
}
