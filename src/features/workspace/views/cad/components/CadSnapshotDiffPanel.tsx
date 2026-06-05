import { useMemo } from "react";

import type {
  CadAssemblyNodeRecord,
  CadImportWarningRecord,
  CadPartDefinitionRecord,
  CadPartInstanceRecord,
  CadSnapshotDiffRecord,
  CadSnapshotDiffSourceKind,
  CadSnapshotDiffStatus,
  CadSnapshotRecord,
  OnshapeOverview,
} from "../model/cadIntegrationTypes";

const EMPTY_ASSEMBLY_NODES: OnshapeOverview["assemblyNodes"] = [];
const EMPTY_PART_DEFINITIONS: OnshapeOverview["partDefinitions"] = [];
const EMPTY_PART_INSTANCES: OnshapeOverview["partInstances"] = [];
const EMPTY_SNAPSHOTS: OnshapeOverview["snapshots"] = [];
const EMPTY_WARNINGS: OnshapeOverview["warnings"] = [];

type SnapshotDiffItem = {
  id: string;
  status: CadSnapshotDiffStatus;
  sourceKind: CadSnapshotDiffSourceKind;
  label: string;
  detail: string;
  subsystemLabel: string;
  mechanismLabel: string;
  partLabel: string;
  changedFields: string[];
  warnings: CadImportWarningRecord[];
};

type SnapshotDiffPartGroup = {
  label: string;
  warnings: CadImportWarningRecord[];
  items: SnapshotDiffItem[];
};

type SnapshotDiffMechanismGroup = {
  label: string;
  warnings: CadImportWarningRecord[];
  parts: SnapshotDiffPartGroup[];
};

type SnapshotDiffSubsystemGroup = {
  label: string;
  warnings: CadImportWarningRecord[];
  mechanisms: SnapshotDiffMechanismGroup[];
};

export type CadSnapshotDiffViewModel = {
  currentSnapshot: CadSnapshotRecord | null;
  previousSnapshot: CadSnapshotRecord | null;
  groups: SnapshotDiffSubsystemGroup[];
  snapshotWarnings: CadImportWarningRecord[];
  counts: Record<CadSnapshotDiffStatus, number>;
};

const statusLabels: Record<CadSnapshotDiffStatus, string> = {
  new: "New",
  changed: "Changed",
  removed: "Removed",
  unchanged: "Unchanged",
};

const statusOrder: Record<CadSnapshotDiffStatus, number> = {
  changed: 0,
  new: 1,
  removed: 2,
  unchanged: 3,
};

function sortedSnapshots(snapshots: CadSnapshotRecord[]) {
  return [...snapshots].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function latestSnapshotFromOverview(overview: OnshapeOverview) {
  return overview.latestSnapshot ?? sortedSnapshots(overview.snapshots ?? EMPTY_SNAPSHOTS)[0] ?? null;
}

function previousSnapshotFor(overview: OnshapeOverview, currentSnapshot: CadSnapshotRecord | null) {
  if (!currentSnapshot) {
    return null;
  }

  const snapshots = overview.snapshots ?? EMPTY_SNAPSHOTS;
  if (currentSnapshot.previousSnapshotId) {
    return snapshots.find((snapshot) => snapshot.id === currentSnapshot.previousSnapshotId) ?? null;
  }

  return sortedSnapshots(snapshots).find((snapshot) => snapshot.id !== currentSnapshot.id) ?? null;
}

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

function recordWarningsFromIds(warningsById: ReadonlyMap<string, CadImportWarningRecord>, ids: string[] | undefined) {
  return (ids ?? []).map((id) => warningsById.get(id)).filter((warning): warning is CadImportWarningRecord => Boolean(warning));
}

function recordKeyForAssembly(node: CadAssemblyNodeRecord) {
  return node.instancePath || node.name || node.id;
}

function recordKeyForPartDefinition(part: CadPartDefinitionRecord) {
  return part.missionControlExternalKey || part.partNumber || part.name || part.id;
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

function buildFallbackItems(overview: OnshapeOverview, currentSnapshot: CadSnapshotRecord | null, previousSnapshot: CadSnapshotRecord | null) {
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
  const currentPartByKey = new Map(currentParts.map((part) => [recordKeyForPartDefinition(part), part] as const));
  const previousPartByKey = new Map(previousParts.map((part) => [recordKeyForPartDefinition(part), part] as const));
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

    const fields: Array<keyof CadAssemblyNodeRecord> = ["name", "inferredType", "parentAssemblyNodeId", "subsystemId", "mechanismId"];
    items.push(assemblyItem(node, hasChanged(node, previous, fields) ? "changed" : "unchanged", warnings, changedFieldNames(node, previous, fields)));
  });
  previousAssemblies.forEach((node) => {
    if (!currentAssemblyByKey.has(recordKeyForAssembly(node))) {
      items.push(assemblyItem(node, "removed", [], []));
    }
  });

  currentParts.forEach((part) => {
    const previous = previousPartByKey.get(recordKeyForPartDefinition(part));
    const warnings = warningsForRecord(currentWarnings, [part.id, part.name, part.partNumber, part.missionControlExternalKey]);
    if (!previous) {
      items.push(partDefinitionItem(part, "new", warnings));
      return;
    }

    const fields: Array<keyof CadPartDefinitionRecord> = ["name", "partNumber", "material", "configuration", "missionControlExternalKey"];
    items.push(partDefinitionItem(part, hasChanged(part, previous, fields) ? "changed" : "unchanged", warnings, changedFieldNames(part, previous, fields)));
  });
  previousParts.forEach((part) => {
    if (!currentPartByKey.has(recordKeyForPartDefinition(part))) {
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

    const fields: Array<keyof CadPartInstanceRecord> = ["cadPartDefinitionId", "parentAssemblyNodeId", "partId", "quantity", "suppressed", "configuration"];
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

function itemFromPlatformRecord(record: CadSnapshotDiffRecord, warningsById: ReadonlyMap<string, CadImportWarningRecord>): SnapshotDiffItem {
  return {
    id: record.id,
    status: record.status,
    sourceKind: record.sourceKind,
    label: record.name,
    detail: record.detail ?? record.instancePath ?? record.sourceId ?? "CAD record",
    subsystemLabel: record.subsystemName ?? (record.subsystemId ? `Subsystem ${record.subsystemId}` : "Unassigned subsystem"),
    mechanismLabel: record.mechanismName ?? (record.mechanismId ? `Mechanism ${record.mechanismId}` : "Unassigned mechanism"),
    partLabel: record.partName ?? record.name,
    changedFields: record.changedFields ?? [],
    warnings: [...(record.warnings ?? []), ...recordWarningsFromIds(warningsById, record.warningIds)],
  };
}

function warningsForItems(items: SnapshotDiffItem[]) {
  const warnings = new Map<string, CadImportWarningRecord>();
  items.forEach((item) => item.warnings.forEach((warning) => warnings.set(warning.id, warning)));
  return [...warnings.values()];
}

function groupItems(items: SnapshotDiffItem[]) {
  const subsystemMap = new Map<string, Map<string, Map<string, SnapshotDiffItem[]>>>();
  items.forEach((item) => {
    if (!subsystemMap.has(item.subsystemLabel)) {
      subsystemMap.set(item.subsystemLabel, new Map());
    }
    const mechanismMap = subsystemMap.get(item.subsystemLabel)!;
    if (!mechanismMap.has(item.mechanismLabel)) {
      mechanismMap.set(item.mechanismLabel, new Map());
    }
    const partMap = mechanismMap.get(item.mechanismLabel)!;
    partMap.set(item.partLabel, [...(partMap.get(item.partLabel) ?? []), item]);
  });

  return [...subsystemMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([subsystemLabel, mechanismMap]) => ({
    label: subsystemLabel,
    warnings: warningsForItems([...mechanismMap.values()].flatMap((partMap) => [...partMap.values()].flat())),
    mechanisms: [...mechanismMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([mechanismLabel, partMap]) => ({
      label: mechanismLabel,
      warnings: warningsForItems([...partMap.values()].flat()),
      parts: [...partMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([partLabel, partItems]) => ({
        label: partLabel,
        warnings: warningsForItems(partItems),
        items: partItems.sort((left, right) => statusOrder[left.status] - statusOrder[right.status] || left.label.localeCompare(right.label)),
      })),
    })),
  }));
}

function emptyCounts(): Record<CadSnapshotDiffStatus, number> {
  return { new: 0, changed: 0, removed: 0, unchanged: 0 };
}

export function buildCadSnapshotDiffViewModel(overview: OnshapeOverview | null): CadSnapshotDiffViewModel {
  if (!overview) {
    return {
      currentSnapshot: null,
      previousSnapshot: null,
      groups: [],
      snapshotWarnings: [],
      counts: emptyCounts(),
    };
  }

  const currentSnapshot = latestSnapshotFromOverview(overview);
  const previousSnapshot = previousSnapshotFor(overview, currentSnapshot);
  const warningsById = new Map((overview.warnings ?? EMPTY_WARNINGS).map((warning) => [warning.id, warning] as const));
  const platformRecords = overview.snapshotDiff?.records ?? overview.snapshotDiffRecords ?? [];
  const items = platformRecords.length
    ? platformRecords.map((record) => itemFromPlatformRecord(record, warningsById))
    : buildFallbackItems(overview, currentSnapshot, previousSnapshot);
  const counts = emptyCounts();
  items.forEach((item) => {
    counts[item.status] += 1;
  });
  const itemWarningIds = new Set(items.flatMap((item) => item.warnings.map((warning) => warning.id)));
  const snapshotWarnings = (overview.warnings ?? EMPTY_WARNINGS).filter((warning) => (
    !itemWarningIds.has(warning.id) &&
    (!currentSnapshot || warning.snapshotId === currentSnapshot.id || warning.importRunId === currentSnapshot.importRunId)
  ));

  return {
    currentSnapshot,
    previousSnapshot,
    groups: groupItems(items),
    snapshotWarnings,
    counts,
  };
}

function WarningBadges({ warnings }: { warnings: CadImportWarningRecord[] }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <span className="cad-diff-warning-stack">
      {warnings.map((warning) => (
        <span className="cad-diff-warning-badge" data-severity={warning.severity} key={warning.id}>
          {warning.title}
        </span>
      ))}
    </span>
  );
}

export function CadSnapshotDiffPanel({ overview }: { overview: OnshapeOverview | null }) {
  const viewModel = useMemo(() => buildCadSnapshotDiffViewModel(overview), [overview]);

  return (
    <section className="cad-card cad-snapshot-diff-card" aria-labelledby="cad-snapshot-diff-title">
      <div className="cad-section-heading cad-snapshot-diff-heading">
        <div>
          <span className="cad-eyebrow">Snapshot diff</span>
          <h3 id="cad-snapshot-diff-title">Onshape change preview</h3>
        </div>
        <span className="cad-preview-pill">Preview only</span>
      </div>
      <p className="cad-diff-context">
        {viewModel.currentSnapshot
          ? `Comparing ${viewModel.currentSnapshot.label} against ${viewModel.previousSnapshot?.label ?? "an empty baseline"}.`
          : "Run BOM Sync to create a CAD snapshot before previewing changes."}
      </p>
      <div className="cad-diff-counts" aria-label="CAD snapshot diff counts">
        {(Object.keys(statusLabels) as CadSnapshotDiffStatus[]).map((status) => (
          <span className="cad-diff-count" data-status={status} key={status}>
            <strong>{viewModel.counts[status]}</strong>
            {statusLabels[status]}
          </span>
        ))}
      </div>

      {viewModel.snapshotWarnings.length ? (
        <div className="cad-diff-snapshot-warnings" aria-label="Snapshot diff warnings">
          {viewModel.snapshotWarnings.map((warning) => (
            <article className="cad-warning-item" data-severity={warning.severity} key={warning.id}>
              <strong>{warning.title}</strong>
              <span>{warning.message}</span>
              <code>{warning.code}</code>
            </article>
          ))}
        </div>
      ) : null}

      {viewModel.groups.length ? (
        <div className="cad-diff-tree">
          {viewModel.groups.map((subsystem) => (
            <section className="cad-diff-group" key={subsystem.label}>
              <h4>{subsystem.label}<WarningBadges warnings={subsystem.warnings} /></h4>
              {subsystem.mechanisms.map((mechanism) => (
                <div className="cad-diff-mechanism" key={mechanism.label}>
                  <h5>{mechanism.label}<WarningBadges warnings={mechanism.warnings} /></h5>
                  {mechanism.parts.map((part) => (
                    <div className="cad-diff-part" key={part.label}>
                      <div className="cad-diff-part-title">
                        <strong>{part.label}</strong>
                        <WarningBadges warnings={part.warnings} />
                      </div>
                      <ul className="cad-diff-record-list">
                        {part.items.map((item) => (
                          <li className="cad-diff-record" data-status={item.status} key={item.id}>
                            <span className="cad-diff-status">{statusLabels[item.status]}</span>
                            <span>
                              <strong>{item.label}</strong>
                              <small>{item.detail}</small>
                              {item.changedFields.length ? <small>Changed: {item.changedFields.join(", ")}</small> : null}
                            </span>
                            <WarningBadges warnings={item.warnings} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : <p className="cad-empty-copy">No CAD-derived records are available for this preview.</p>}
    </section>
  );
}
