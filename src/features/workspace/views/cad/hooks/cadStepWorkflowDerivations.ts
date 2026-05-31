import type {
  CadStepImportRunRecord,
  CadStepSnapshotRecord,
} from "../model/cadIntegrationTypes";

export function findCadSnapshot(
  snapshots: CadStepSnapshotRecord[],
  selectedSnapshotId: string,
) {
  return snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null;
}

export function findCadImportRun(
  importRuns: CadStepImportRunRecord[],
  snapshot: CadStepSnapshotRecord | null,
) {
  return snapshot ? importRuns.find((run) => run.id === snapshot.importRunId) ?? null : null;
}

export function findLatestSuccessfulStepImportRun(importRuns: CadStepImportRunRecord[]) {
  return importRuns.reduce<CadStepImportRunRecord | null>((latestRun, run) => {
    if (run.source !== "STEP_UPLOAD" || run.status === "FAILED" || run.status === "CANCELED") {
      return latestRun;
    }

    return !latestRun || Date.parse(run.createdAt) > Date.parse(latestRun.createdAt)
      ? run
      : latestRun;
  }, null);
}
