import type { CadPartDefinitionRecord } from "./cadIntegrationTypes";

function partConfigKey(part: CadPartDefinitionRecord) {
  return part.configuration ?? "default";
}

function partExternalKey(part: CadPartDefinitionRecord) {
  return part.missionControlExternalKey ? `${part.missionControlExternalKey}:${partConfigKey(part)}` : null;
}

function partNumberKey(part: CadPartDefinitionRecord) {
  return part.partNumber ? `${part.partNumber}:${partConfigKey(part)}` : null;
}

function partNameKey(part: CadPartDefinitionRecord) {
  return part.name ? `${part.name}:${partConfigKey(part)}` : null;
}

function partMapByKey(parts: CadPartDefinitionRecord[], keyForPart: (part: CadPartDefinitionRecord) => string | null) {
  return new Map(parts.flatMap((part) => {
    const key = keyForPart(part);
    return key ? [[key, part] as const] : [];
  }));
}

export function createPartDefinitionMatcher(currentParts: CadPartDefinitionRecord[], previousParts: CadPartDefinitionRecord[]) {
  const currentPartsByExternalKey = partMapByKey(currentParts, partExternalKey);
  const currentPartsByPartNumber = partMapByKey(currentParts, partNumberKey);
  const currentPartsByName = partMapByKey(currentParts, partNameKey);
  const previousPartsByExternalKey = partMapByKey(previousParts, partExternalKey);
  const previousPartsByPartNumber = partMapByKey(previousParts, partNumberKey);
  const previousPartsByName = partMapByKey(previousParts, partNameKey);

  return {
    findPreviousPart(part: CadPartDefinitionRecord) {
      return (
        (partExternalKey(part) ? previousPartsByExternalKey.get(partExternalKey(part) ?? "") : null)
          ?? (partNumberKey(part) ? previousPartsByPartNumber.get(partNumberKey(part) ?? "") : null)
          ?? (partNameKey(part) ? previousPartsByName.get(partNameKey(part) ?? "") : null)
          ?? null
      );
    },
    hasCurrentPart(part: CadPartDefinitionRecord) {
      return Boolean(
        (partExternalKey(part) ? currentPartsByExternalKey.get(partExternalKey(part) ?? "") : null)
          ?? (partNumberKey(part) ? currentPartsByPartNumber.get(partNumberKey(part) ?? "") : null)
          ?? (partNameKey(part) ? currentPartsByName.get(partNameKey(part) ?? "") : null),
      );
    },
  };
}
