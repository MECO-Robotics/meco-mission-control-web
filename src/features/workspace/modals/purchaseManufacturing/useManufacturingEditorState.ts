import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";

import { getManufacturingPartInstanceOptions } from "@/lib/appUtils/manufacturing";

const COMMON_MATERIALS = [
  "Aluminum 6061",
  "Steel 4130",
  "Polycarbonate",
  "PLA - Black",
  "PLA - Blue",
  "PETG",
  "TPU",
  "Delrin",
  "Wood",
];

export function useManufacturingEditorState(
  bootstrap: BootstrapPayload,
  manufacturingDraft: ManufacturingItemPayload,
) {
  const materialOptions =
    bootstrap.materials.length > 0
      ? bootstrap.materials
      : COMMON_MATERIALS.map((name) => ({ id: name, name }));
  const filteredPartInstances = getManufacturingPartInstanceOptions(bootstrap, manufacturingDraft);
  const selectedPartDefinition = manufacturingDraft.partDefinitionId
    ? bootstrap.partDefinitions.find(
        (partDefinition) => partDefinition.id === manufacturingDraft.partDefinitionId,
      ) ?? null
    : null;
  const selectedPartInstanceIds = manufacturingDraft.partInstanceIds.length
    ? manufacturingDraft.partInstanceIds
    : manufacturingDraft.partInstanceId
      ? [manufacturingDraft.partInstanceId]
      : [];
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;

  const getPartInstanceSubtitle = (partInstance: BootstrapPayload["partInstances"][number]) =>
    [
      subsystemsById[partInstance.subsystemId]?.name ?? "Unknown subsystem",
      partInstance.mechanismId
        ? mechanismsById[partInstance.mechanismId]?.name ?? "Unknown mechanism"
        : null,
    ]
      .filter(Boolean)
      .join(" / ");

  return {
    filteredPartInstances,
    getPartInstanceSubtitle,
    materialOptions,
    selectedPartDefinition,
    selectedPartInstanceIds,
  };
}
