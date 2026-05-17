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
