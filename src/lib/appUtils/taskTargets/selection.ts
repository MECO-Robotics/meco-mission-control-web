import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { normalizeTaskTargetPayload } from "./normalization";

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
