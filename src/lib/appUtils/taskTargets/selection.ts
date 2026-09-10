import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { createLookupById, removeId, uniqueIds } from "../internal";
import type { TaskTargetSelection } from "./labels";
import { getTaskTargetArrays, normalizeTaskTargetPayload } from "./normalization";

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
  const mechanismsById = createLookupById(bootstrap.mechanisms);
  const partInstancesById = createLookupById(bootstrap.partInstances);

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
