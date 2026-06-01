import type { OnshapeOverview } from "../model/cadIntegrationTypes";

import { useMemo } from "react";

const EMPTY_ASSEMBLY_NODES: OnshapeOverview["assemblyNodes"] = [];
const EMPTY_IMPORT_RUNS: OnshapeOverview["importRuns"] = [];
const EMPTY_PART_DEFINITIONS: OnshapeOverview["partDefinitions"] = [];
const EMPTY_PART_INSTANCES: OnshapeOverview["partInstances"] = [];
const EMPTY_SNAPSHOTS: OnshapeOverview["snapshots"] = [];
const EMPTY_WARNINGS: OnshapeOverview["warnings"] = [];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "not yet";
  }
  return new Date(value).toLocaleString();
}

function partName(partDefinitionNamesById: ReadonlyMap<string, string>, partDefinitionId: string | null) {
  if (!partDefinitionId) {
    return "Unresolved part";
  }
  return partDefinitionNamesById.get(partDefinitionId) ?? "Unresolved part";
}

function parentAssemblyName(assemblyNodeNamesById: ReadonlyMap<string, string>, assemblyNodeId: string | null) {
  if (!assemblyNodeId) {
    return "No parent";
  }
  return assemblyNodeNamesById.get(assemblyNodeId) ?? "No parent";
}

export function CadDataPanels({ overview }: { overview: OnshapeOverview | null }) {
  const runs = overview?.importRuns ?? EMPTY_IMPORT_RUNS;
  const snapshots = overview?.snapshots ?? EMPTY_SNAPSHOTS;
  const nodes = overview?.assemblyNodes ?? EMPTY_ASSEMBLY_NODES;
  const partDefinitions = overview?.partDefinitions ?? EMPTY_PART_DEFINITIONS;
  const partInstances = overview?.partInstances ?? EMPTY_PART_INSTANCES;
  const warnings = overview?.warnings ?? EMPTY_WARNINGS;
  const partDefinitionNamesById = useMemo(
    () => new Map(partDefinitions.map((part) => [part.id, part.name] as const)),
    [partDefinitions],
  );
  const assemblyNodeNamesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.name] as const)),
    [nodes],
  );
  const partInstanceCountsByDefinitionId = useMemo(() => {
    const counts = new Map<string, number>();
    partInstances.forEach((instance) => {
      if (instance.cadPartDefinitionId) {
        counts.set(instance.cadPartDefinitionId, (counts.get(instance.cadPartDefinitionId) ?? 0) + 1);
      }
    });
    return counts;
  }, [partInstances]);

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
                const count = partInstanceCountsByDefinitionId.get(part.id) ?? 0;
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
                  <td><code>{instance.instancePath}</code></td><td>{partName(partDefinitionNamesById, instance.cadPartDefinitionId)}</td>
                  <td>{parentAssemblyName(assemblyNodeNamesById, instance.parentAssemblyNodeId)}</td><td>{instance.quantity}</td>
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
