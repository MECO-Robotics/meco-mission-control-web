import type { CadStepSnapshotRecord } from "../model/cadIntegrationTypes";

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
