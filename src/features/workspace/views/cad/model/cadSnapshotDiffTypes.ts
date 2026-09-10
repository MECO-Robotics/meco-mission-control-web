import type {
  CadImportWarningRecord,
  CadSnapshotDiffSourceKind,
  CadSnapshotDiffStatus,
  CadSnapshotRecord,
} from "./cadIntegrationTypes";

export type SnapshotDiffItem = {
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

export type SnapshotDiffPartGroup = {
  label: string;
  warnings: CadImportWarningRecord[];
  items: SnapshotDiffItem[];
};

export type SnapshotDiffMechanismGroup = {
  label: string;
  warnings: CadImportWarningRecord[];
  parts: SnapshotDiffPartGroup[];
};

export type SnapshotDiffSubsystemGroup = {
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
