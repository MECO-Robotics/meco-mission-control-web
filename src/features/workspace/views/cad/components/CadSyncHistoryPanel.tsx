import type {
  CadImportRunRecord,
  OnshapeOverview,
  OnshapeSyncJobRecord,
  SyncLevel,
} from "../model/cadIntegrationTypes";

type SyncHistoryRow = {
  id: string;
  label: string;
  status: CadImportRunRecord["status"];
  actor: string;
  timestamp: string | null;
  syncLevel: SyncLevel | "unknown";
  warningCount: number | null;
  changedObjectCount: number | null;
  errorSummary: string | null;
};

const EMPTY_IMPORT_RUNS: OnshapeOverview["importRuns"] = [];
const EMPTY_SYNC_JOBS: NonNullable<OnshapeOverview["syncJobs"]> = [];
const EMPTY_WARNINGS: OnshapeOverview["warnings"] = [];
const EMPTY_SNAPSHOTS: OnshapeOverview["snapshots"] = [];
const EMPTY_ASSEMBLY_NODES: OnshapeOverview["assemblyNodes"] = [];
const EMPTY_PART_DEFINITIONS: OnshapeOverview["partDefinitions"] = [];
const EMPTY_PART_INSTANCES: OnshapeOverview["partInstances"] = [];

function formatDate(value: string | null) {
  if (!value) {
    return "not finished";
  }
  return new Date(value).toLocaleString();
}

function numberFromSummary(summary: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = summary[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function changedCountFromSummary(summary: Record<string, unknown>) {
  const directCount = numberFromSummary(summary, ["changedObjectCount", "changedObjects", "objectChangeCount"]);
  if (directCount !== null) {
    return directCount;
  }

  const assemblyNodeCount = numberFromSummary(summary, ["assemblyNodeCount"]);
  const partDefinitionCount = numberFromSummary(summary, ["partDefinitionCount"]);
  const partInstanceCount = numberFromSummary(summary, ["partInstanceCount"]);
  if (assemblyNodeCount !== null || partDefinitionCount !== null || partInstanceCount !== null) {
    return (assemblyNodeCount ?? 0) + (partDefinitionCount ?? 0) + (partInstanceCount ?? 0);
  }

  return null;
}

function changedCountFromSnapshot(overview: OnshapeOverview, importRunId: string) {
  const snapshot = (overview.snapshots ?? EMPTY_SNAPSHOTS).find((item) => item.importRunId === importRunId);
  if (!snapshot) {
    return null;
  }

  return (
    (overview.assemblyNodes ?? EMPTY_ASSEMBLY_NODES).filter((item) => item.snapshotId === snapshot.id).length +
    (overview.partDefinitions ?? EMPTY_PART_DEFINITIONS).filter((item) => item.snapshotId === snapshot.id).length +
    (overview.partInstances ?? EMPTY_PART_INSTANCES).filter((item) => item.snapshotId === snapshot.id).length
  );
}

function warningCountForRun(overview: OnshapeOverview, importRunId: string) {
  return (overview.warnings ?? EMPTY_WARNINGS).filter((warning) => warning.importRunId === importRunId).length;
}

function getRunById(importRuns: CadImportRunRecord[], importRunId: string) {
  return importRuns.find((run) => run.id === importRunId) ?? null;
}

function rowFromSyncJob(
  overview: OnshapeOverview,
  job: OnshapeSyncJobRecord,
  importRuns: CadImportRunRecord[],
): SyncHistoryRow {
  const run = getRunById(importRuns, job.importRunId);
  const warningCount = numberFromSummary(job.summaryJson, ["warningCount"]) ?? warningCountForRun(overview, job.importRunId);
  const changedObjectCount = changedCountFromSummary(job.summaryJson) ?? changedCountFromSnapshot(overview, job.importRunId);
  return {
    id: job.id,
    label: run?.id ? `${job.id} / ${run.id}` : job.id,
    status: job.status,
    actor: job.actor || run?.requestedBy || "Actor not reported by platform",
    timestamp: job.completedAt ?? job.startedAt,
    syncLevel: run?.syncLevel ?? "unknown",
    warningCount,
    changedObjectCount,
    errorSummary: job.status === "failed"
      ? job.errorMessage || run?.errorMessage || run?.stoppedReason || "Review Onshape credentials, permissions, and the saved document reference."
      : null,
  };
}

function rowFromImportRun(overview: OnshapeOverview, run: CadImportRunRecord): SyncHistoryRow {
  const summary = run.rawSummaryJson ?? {};
  return {
    id: run.id,
    label: run.id,
    status: run.status,
    actor: run.requestedBy || "Actor not reported by platform",
    timestamp: run.completedAt ?? run.startedAt,
    syncLevel: run.syncLevel,
    warningCount: numberFromSummary(summary, ["warningCount"]) ?? warningCountForRun(overview, run.id),
    changedObjectCount: changedCountFromSummary(summary) ?? changedCountFromSnapshot(overview, run.id),
    errorSummary: run.status === "failed"
      ? run.errorMessage || run.stoppedReason || "Review Onshape credentials, permissions, and the saved document reference."
      : null,
  };
}

export function buildSyncHistoryRows(overview: OnshapeOverview | null): SyncHistoryRow[] {
  if (!overview) {
    return [];
  }

  const importRuns = overview.importRuns ?? EMPTY_IMPORT_RUNS;
  const syncJobs = overview.syncJobs ?? EMPTY_SYNC_JOBS;
  const rows = syncJobs.length
    ? syncJobs.map((job) => rowFromSyncJob(overview, job, importRuns))
    : importRuns.map((run) => rowFromImportRun(overview, run));

  return rows.sort((left, right) => {
    const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
    const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;
    return rightTime - leftTime;
  });
}

function countCopy(value: number | null, missingCopy: string) {
  return value === null ? missingCopy : String(value);
}

export function CadSyncHistoryPanel({ overview }: { overview: OnshapeOverview | null }) {
  const rows = buildSyncHistoryRows(overview).slice(0, 8);

  return (
    <section className="cad-card cad-sync-history-card" aria-labelledby="cad-sync-history-title">
      <div className="cad-section-heading">
        <span className="cad-eyebrow">Sync history</span>
        <h3 id="cad-sync-history-title">Recent Onshape sync attempts</h3>
      </div>
      {rows.length ? (
        <div className="cad-table-wrap">
          <table className="cad-table cad-sync-history-table">
            <thead>
              <tr>
                <th>Attempt</th>
                <th>Status</th>
                <th>Actor</th>
                <th>Timestamp</th>
                <th>Warnings</th>
                <th>Changed objects</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr data-status={row.status} key={row.id}>
                  <td>
                    <strong>{row.label}</strong>
                    <small>{row.syncLevel.replace(/_/g, " ")}</small>
                    {row.errorSummary ? <p className="cad-sync-error-summary">{row.errorSummary}</p> : null}
                  </td>
                  <td><span className="cad-sync-status-pill">{row.status}</span></td>
                  <td>{row.actor}</td>
                  <td>{formatDate(row.timestamp)}</td>
                  <td>{countCopy(row.warningCount, "not reported")}</td>
                  <td>{countCopy(row.changedObjectCount, "not reported")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="cad-empty-copy">
          No Onshape sync attempts yet. Save an Onshape document link, choose a sync level, then run the selected sync.
        </p>
      )}
    </section>
  );
}
