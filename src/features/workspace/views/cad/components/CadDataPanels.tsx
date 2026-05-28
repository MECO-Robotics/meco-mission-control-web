import type { OnshapeOverview } from "../model/cadIntegrationTypes";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "not yet";
  }
  return new Date(value).toLocaleString();
}

function partName(overview: OnshapeOverview, partDefinitionId: string | null) {
  if (!partDefinitionId) {
    return "Unresolved part";
  }
  return overview.partDefinitions.find((part) => part.id === partDefinitionId)?.name ?? "Unresolved part";
}

function parentAssemblyName(overview: OnshapeOverview, assemblyNodeId: string | null) {
  if (!assemblyNodeId) {
    return "No parent";
  }
  return overview.assemblyNodes.find((node) => node.id === assemblyNodeId)?.name ?? "No parent";
}

export function CadDataPanels({ overview }: { overview: OnshapeOverview | null }) {
  const runs = overview?.importRuns ?? [];
  const snapshots = overview?.snapshots ?? [];
  const nodes = overview?.assemblyNodes ?? [];
  const partDefinitions = overview?.partDefinitions ?? [];
  const partInstances = overview?.partInstances ?? [];
  const warnings = overview?.warnings ?? [];

  return (
    <div className="cad-data-stack">
      <section className="cad-card">
        <div className="cad-section-heading">
          <span className="cad-eyebrow">History</span>
          <h3>Import runs</h3>
        </div>
        <div className="cad-table-wrap">
          <table className="cad-table">
            <thead><tr><th>Run</th><th>Level</th><th>Status</th><th>Calls</th><th>Completed</th></tr></thead>
            <tbody>
              {runs.length ? runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.id}</td><td>{run.syncLevel}</td><td>{run.status}</td>
                  <td>{run.callsUsed}{run.callsEstimated !== null ? ` / ${run.callsEstimated}` : ""}</td>
                  <td>{formatDate(run.completedAt)}</td>
                </tr>
              )) : <tr><td colSpan={5}>No import runs yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="cad-grid cad-grid-two">
        <section className="cad-card">
          <div className="cad-section-heading">
            <span className="cad-eyebrow">CAD tree</span>
            <h3>Assembly nodes</h3>
          </div>
          <div className="cad-tree-list">
            {nodes.length ? nodes.map((node) => (
              <div className="cad-tree-row" key={node.id}>
                <strong>{node.name}</strong>
                <span>{node.inferredType.replace(/_/g, " ")}</span>
                <code>{node.instancePath}</code>
              </div>
            )) : <p className="cad-empty-copy">Run BOM Sync to import assembly nodes.</p>}
          </div>
        </section>

        <section className="cad-card">
          <div className="cad-section-heading">
            <span className="cad-eyebrow">Snapshots</span>
            <h3>Cached CAD snapshots</h3>
          </div>
          <div className="cad-snapshot-list">
            {snapshots.length ? snapshots.map((snapshot) => (
              <article className="cad-snapshot-item" key={snapshot.id}>
                <strong>{snapshot.label}</strong>
                <span>{snapshot.immutable ? "immutable" : "workspace draft"} - {snapshot.source}</span>
                <small>{formatDate(snapshot.createdAt)}</small>
              </article>
            )) : <p className="cad-empty-copy">No snapshots yet.</p>}
          </div>
          <div className="cad-compare-placeholder">Snapshot comparison placeholder</div>
        </section>
      </div>

      <section className="cad-card">
        <div className="cad-section-heading">
          <span className="cad-eyebrow">Imported parts</span>
          <h3>Definitions and instances</h3>
        </div>
        <div className="cad-table-wrap">
          <table className="cad-table">
            <thead><tr><th>Part</th><th>Part number</th><th>Material</th><th>Config</th><th>Instances</th></tr></thead>
            <tbody>
              {partDefinitions.length ? partDefinitions.map((part) => {
                const count = partInstances.filter((instance) => instance.cadPartDefinitionId === part.id).length;
                return (
                  <tr key={part.id}>
                    <td>{part.name}</td><td>{part.partNumber ?? "missing"}</td>
                    <td>{part.material ?? "missing"}</td><td>{part.configuration ?? "default"}</td><td>{count}</td>
                  </tr>
                );
              }) : <tr><td colSpan={5}>No imported part definitions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cad-card">
        <div className="cad-section-heading">
          <span className="cad-eyebrow">Instances</span>
          <h3>Assembly placements</h3>
        </div>
        <div className="cad-table-wrap">
          <table className="cad-table">
            <thead><tr><th>Instance path</th><th>Part</th><th>Parent</th><th>Qty</th><th>Suppressed</th></tr></thead>
            <tbody>
              {partInstances.length ? partInstances.map((instance) => (
                <tr key={instance.id}>
                  <td><code>{instance.instancePath}</code></td><td>{partName(overview!, instance.cadPartDefinitionId)}</td>
                  <td>{parentAssemblyName(overview!, instance.parentAssemblyNodeId)}</td><td>{instance.quantity}</td>
                  <td>{instance.suppressed ? "yes" : "no"}</td>
                </tr>
              )) : <tr><td colSpan={5}>No imported part instances yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cad-card">
        <div className="cad-section-heading">
          <span className="cad-eyebrow">Warnings</span>
          <h3>Import warnings</h3>
        </div>
        <div className="cad-warning-list">
          {warnings.length ? warnings.map((warning) => (
            <article className="cad-warning-item" data-severity={warning.severity} key={warning.id}>
              <strong>{warning.title}</strong>
              <span>{warning.message}</span>
              <code>{warning.code}</code>
            </article>
          )) : <p className="cad-empty-copy">No warnings yet.</p>}
        </div>
      </section>
    </div>
  );
}
