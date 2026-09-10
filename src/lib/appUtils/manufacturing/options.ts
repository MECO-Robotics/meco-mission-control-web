import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

export function getManufacturingPartInstanceOptions(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
) {
  if (!draft.partDefinitionId) {
    return [];
  }

  return bootstrap.partInstances.filter(
    (partInstance) => partInstance.partDefinitionId === draft.partDefinitionId,
  );
}
