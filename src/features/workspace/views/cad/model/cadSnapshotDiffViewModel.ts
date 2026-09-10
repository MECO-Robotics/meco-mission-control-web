import type {
  CadImportWarningRecord,
  CadSnapshotDiffRecord,
  CadSnapshotDiffStatus,
  CadSnapshotRecord,
  OnshapeOverview,
} from "./cadIntegrationTypes";
import { buildFallbackItems } from "./cadSnapshotDiffFallback";
import type { CadSnapshotDiffViewModel, SnapshotDiffItem } from "./cadSnapshotDiffTypes";

export type {
  CadSnapshotDiffViewModel,
  SnapshotDiffItem,
  SnapshotDiffMechanismGroup,
  SnapshotDiffPartGroup,
  SnapshotDiffSubsystemGroup,
} from "./cadSnapshotDiffTypes";

const EMPTY_SNAPSHOTS: OnshapeOverview["snapshots"] = [];
const EMPTY_WARNINGS: OnshapeOverview["warnings"] = [];

export const cadSnapshotDiffStatusLabels: Record<CadSnapshotDiffStatus, string> = {
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

  return sortedSnapshots(snapshots).find((snapshot) => (
    snapshot.id !== currentSnapshot.id &&
    snapshot.onshapeDocumentRefId === currentSnapshot.onshapeDocumentRefId
  )) ?? null;
}

function recordWarningsFromIds(warningsById: ReadonlyMap<string, CadImportWarningRecord>, ids: string[] | undefined) {
  return (ids ?? []).map((id) => warningsById.get(id)).filter((warning): warning is CadImportWarningRecord => Boolean(warning));
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
