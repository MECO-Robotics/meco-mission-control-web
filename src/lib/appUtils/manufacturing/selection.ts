import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import { uniqueIds } from "../internal";
import {
  getManufacturingPartInstancesByIds,
  getManufacturingQuantityFromInstances,
} from "./partSelection";
import { getManufacturingPartInstanceOptions } from "./options";

export function normalizeManufacturingPartInstanceSelection(
  bootstrap: BootstrapPayload,
  draft: ManufacturingItemPayload,
  partInstanceIds: string[],
) {
  const validPartInstanceIds = new Set(
    getManufacturingPartInstanceOptions(bootstrap, draft).map((partInstance) => partInstance.id),
  );
  const selectedPartInstances = getManufacturingPartInstancesByIds(
    bootstrap,
    uniqueIds(partInstanceIds).filter((partInstanceId) => validPartInstanceIds.has(partInstanceId)),
  );
  const primaryPartInstance = selectedPartInstances[0] ?? null;

  return {
    ...draft,
    partInstanceId: primaryPartInstance?.id ?? null,
    partInstanceIds: selectedPartInstances.map((partInstance) => partInstance.id),
    quantity: getManufacturingQuantityFromInstances(draft, selectedPartInstances),
    subsystemId: primaryPartInstance?.subsystemId ?? draft.subsystemId,
  };
}
