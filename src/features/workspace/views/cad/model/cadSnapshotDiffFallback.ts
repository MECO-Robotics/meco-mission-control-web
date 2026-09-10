import type {
  CadAssemblyNodeRecord,
  CadImportWarningRecord,
  CadPartDefinitionRecord,
  CadPartInstanceRecord,
  CadSnapshotDiffStatus,
  CadSnapshotRecord,
  OnshapeOverview,
} from "./cadIntegrationTypes";
import { createPartDefinitionMatcher } from "./cadSnapshotDiffPartMatching";
import type { SnapshotDiffItem } from "./cadSnapshotDiffTypes";

const EMPTY_ASSEMBLY_NODES: OnshapeOverview["assemblyNodes"] = [];
const EMPTY_PART_DEFINITIONS: OnshapeOverview["partDefinitions"] = [];
const EMPTY_PART_INSTANCES: OnshapeOverview["partInstances"] = [];
const EMPTY_WARNINGS: OnshapeOverview["warnings"] = [];

function normalize(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function hasChanged<TRecord>(current: TRecord, previous: TRecord, fields: Array<keyof TRecord>) {
  return fields.some((field) => normalize(current[field]) !== normalize(previous[field]));
}

function changedFieldNames<TRecord>(current: TRecord, previous: TRecord, fields: Array<keyof TRecord>) {
  return fields.filter((field) => normalize(current[field]) !== normalize(previous[field])).map(String);
}

function includesRecordReference(warning: CadImportWarningRecord, references: Array<string | null | undefined>) {
  const haystack = `${warning.code} ${warning.title} ${warning.message}`.toLowerCase();
  return references.some((reference) => {
    const value = reference?.trim().toLowerCase();
    return Boolean(value && value.length >= 3 && haystack.includes(value));
  });
}

function warningsForRecord(warnings: CadImportWarningRecord[], references: Array<string | null | undefined>) {
  return warnings.filter((warning) => includesRecordReference(warning, references));
}

function recordKeyForAssembly(node: CadAssemblyNodeRecord) {
  return node.instancePath || node.name || node.id;
}

function recordKeyForPartInstance(instance: CadPartInstanceRecord, partDefinitionName: string) {
  return instance.instancePath || `${partDefinitionName}:${instance.parentAssemblyNodeId ?? "root"}`;
}

function compactList(values: string[]) {
  return values.filter(Boolean).join(", ");
}

function assemblyItem(
  node: CadAssemblyNodeRecord,
  status: CadSnapshotDiffStatus,
  warnings: CadImportWarningRecord[],
  changedFields: string[] = [],
): SnapshotDiffItem {
  return {
    id: `assembly:${status}:${node.id}`,
    status,
    sourceKind: "assembly_node",
    label: node.name,
    detail: `${node.inferredType.replace(/_/g, " ")} - ${node.instancePath}`,
    subsystemLabel: node.subsystemId ? `Subsystem ${node.subsystemId}` : "Unassigned subsystem",
    mechanismLabel: node.mechanismId ? `Mechanism ${node.mechanismId}` : "Unassigned mechanism",
    partLabel: "Assembly structure",
    changedFields,
    warnings,
  };
}

function partDefinitionItem(
  part: CadPartDefinitionRecord,
  status: CadSnapshotDiffStatus,
  warnings: CadImportWarningRecord[],
  changedFields: string[] = [],
): SnapshotDiffItem {
  return {
    id: `part-definition:${status}:${part.id}`,
    status,
    sourceKind: "part_definition",
    label: part.name,
    detail: compactList([part.partNumber ? `PN ${part.partNumber}` : "", part.material ?? "", part.configuration ?? "default"]),
    subsystemLabel: "Unassigned subsystem",
    mechanismLabel: "Unassigned mechanism",
    partLabel: part.name,
    changedFields,
    warnings,
  };
}

function partInstanceItem(
  instance: CadPartInstanceRecord,
  status: CadSnapshotDiffStatus,
  partName: string,
  parentNode: CadAssemblyNodeRecord | null,
  warnings: CadImportWarningRecord[],
  changedFields: string[] = [],
): SnapshotDiffItem {
  return {
    id: `part-instance:${status}:${instance.id}`,
    status,
    sourceKind: "part_instance",
    label: partName,
    detail: `${instance.instancePath} - qty ${instance.quantity}${instance.suppressed ? " - suppressed" : ""}`,
    subsystemLabel: parentNode?.subsystemId ? `Subsystem ${parentNode.subsystemId}` : "Unassigned subsystem",
    mechanismLabel: parentNode?.mechanismId ? `Mechanism ${parentNode.mechanismId}` : "Unassigned mechanism",
    partLabel: partName,
    changedFields,
    warnings,
  };
}

export function buildFallbackItems(
  overview: OnshapeOverview,
  currentSnapshot: CadSnapshotRecord | null,
  previousSnapshot: CadSnapshotRecord | null,
) {
  if (!currentSnapshot) {
    return [];
  }

  const currentSnapshotId = currentSnapshot.id;
  const previousSnapshotId = previousSnapshot?.id ?? null;
  const assemblyNodes = overview.assemblyNodes ?? EMPTY_ASSEMBLY_NODES;
  const partDefinitions = overview.partDefinitions ?? EMPTY_PART_DEFINITIONS;
  const partInstances = overview.partInstances ?? EMPTY_PART_INSTANCES;
  const currentWarnings = (overview.warnings ?? EMPTY_WARNINGS).filter((warning) => (
    warning.snapshotId === currentSnapshotId || warning.importRunId === currentSnapshot.importRunId
  ));
  const currentAssemblies = assemblyNodes.filter((node) => node.snapshotId === currentSnapshotId);
  const previousAssemblies = previousSnapshotId ? assemblyNodes.filter((node) => node.snapshotId === previousSnapshotId) : [];
  const currentParts = partDefinitions.filter((part) => part.snapshotId === currentSnapshotId);
  const previousParts = previousSnapshotId ? partDefinitions.filter((part) => part.snapshotId === previousSnapshotId) : [];
  const currentInstances = partInstances.filter((instance) => instance.snapshotId === currentSnapshotId);
  const previousInstances = previousSnapshotId ? partInstances.filter((instance) => instance.snapshotId === previousSnapshotId) : [];
  const currentAssemblyByKey = new Map(currentAssemblies.map((node) => [recordKeyForAssembly(node), node] as const));
  const previousAssemblyByKey = new Map(previousAssemblies.map((node) => [recordKeyForAssembly(node), node] as const));
  const partMatcher = createPartDefinitionMatcher(currentParts, previousParts);
  const partNamesById = new Map(partDefinitions.map((part) => [part.id, part.name] as const));
  const currentInstancesByKey = new Map(currentInstances.map((instance) => [
    recordKeyForPartInstance(instance, partNamesById.get(instance.cadPartDefinitionId ?? "") ?? "Unresolved part"),
    instance,
  ] as const));
  const previousInstancesByKey = new Map(previousInstances.map((instance) => [
    recordKeyForPartInstance(instance, partNamesById.get(instance.cadPartDefinitionId ?? "") ?? "Unresolved part"),
    instance,
  ] as const));
  const nodesById = new Map(assemblyNodes.map((node) => [node.id, node] as const));
  const items: SnapshotDiffItem[] = [];

  currentAssemblies.forEach((node) => {
    const previous = previousAssemblyByKey.get(recordKeyForAssembly(node));
    const warnings = warningsForRecord(currentWarnings, [node.id, node.name, node.instancePath]);
    if (!previous) {
      items.push(assemblyItem(node, "new", warnings));
      return;
    }

    const fields: Array<keyof CadAssemblyNodeRecord> = ["name", "inferredType", "subsystemId", "mechanismId"];
    items.push(assemblyItem(node, hasChanged(node, previous, fields) ? "changed" : "unchanged", warnings, changedFieldNames(node, previous, fields)));
  });
  previousAssemblies.forEach((node) => {
    if (!currentAssemblyByKey.has(recordKeyForAssembly(node))) {
      items.push(assemblyItem(node, "removed", [], []));
    }
  });

  currentParts.forEach((part) => {
    const previous = partMatcher.findPreviousPart(part);
    const warnings = warningsForRecord(currentWarnings, [part.id, part.name, part.partNumber, part.missionControlExternalKey]);
    if (!previous) {
      items.push(partDefinitionItem(part, "new", warnings));
      return;
    }

    const fields: Array<keyof CadPartDefinitionRecord> = ["name", "partNumber", "material", "configuration", "missionControlExternalKey"];
    items.push(partDefinitionItem(part, hasChanged(part, previous, fields) ? "changed" : "unchanged", warnings, changedFieldNames(part, previous, fields)));
  });
  previousParts.forEach((part) => {
    if (!partMatcher.hasCurrentPart(part)) {
      items.push(partDefinitionItem(part, "removed", [], []));
    }
  });

  currentInstances.forEach((instance) => {
    const partName = partNamesById.get(instance.cadPartDefinitionId ?? "") ?? "Unresolved part";
    const previous = previousInstancesByKey.get(recordKeyForPartInstance(instance, partName));
    const parentNode = nodesById.get(instance.parentAssemblyNodeId ?? "") ?? null;
    const warnings = warningsForRecord(currentWarnings, [instance.id, instance.instancePath, partName]);
    if (!previous) {
      items.push(partInstanceItem(instance, "new", partName, parentNode, warnings));
      return;
    }

    const fields: Array<keyof CadPartInstanceRecord> = ["partId", "quantity", "suppressed", "configuration"];
    items.push(partInstanceItem(instance, hasChanged(instance, previous, fields) ? "changed" : "unchanged", partName, parentNode, warnings, changedFieldNames(instance, previous, fields)));
  });
  previousInstances.forEach((instance) => {
    const partName = partNamesById.get(instance.cadPartDefinitionId ?? "") ?? "Unresolved part";
    if (!currentInstancesByKey.has(recordKeyForPartInstance(instance, partName))) {
      items.push(partInstanceItem(instance, "removed", partName, nodesById.get(instance.parentAssemblyNodeId ?? "") ?? null, [], []));
    }
  });

  return items;
}
