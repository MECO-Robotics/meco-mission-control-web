import type { CadStepSnapshotRecord } from "../model/cadIntegrationTypes";

export function CadStepImportHeader({
  selectedSnapshot,
}: {
  selectedSnapshot: CadStepSnapshotRecord | null;
}) {
  return (
    <div className="panel-header compact-header cad-header">
      <div className="queue-section-header">
        <h2>STEP import</h2>
        <p className="section-copy">
          Upload STEP exports, review detected structure, and carry confirmed mappings forward across iterations.
        </p>
      </div>
      <div className="cad-header-meta">
        <span>STEP load workflow</span>
        <span>{selectedSnapshot ? `Last import ${new Date(selectedSnapshot.createdAt).toLocaleString()}` : "No STEP snapshot yet"}</span>
      </div>
    </div>
  );
}

export function CadStepSnapshotSelector({
  onSnapshotChange,
  selectedSnapshotId,
  snapshots,
}: {
  onSnapshotChange: (snapshotId: string) => void;
  selectedSnapshotId: string;
  snapshots: CadStepSnapshotRecord[];
}) {
  return (
    <div className="cad-step-snapshot-bar">
      <label className="cad-field">
        <span>Snapshot</span>
        <select onChange={(event) => onSnapshotChange(event.target.value)} value={selectedSnapshotId}>
          <option value="">No STEP snapshot selected</option>
          {snapshots.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>{snapshot.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
