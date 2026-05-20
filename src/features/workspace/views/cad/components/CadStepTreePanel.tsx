import { useState } from "react";

import { IconChevronRight } from "@/components/shared/Icons";
import type {
  CadStepImportRunRecord,
  CadStepTreePartInstanceRecord,
  CadStepTreeNode,
} from "../model/cadIntegrationTypes";

function mappingTone(mapping?: CadStepTreeNode["mapping"] | CadStepTreeNode["partInstances"][number]["mapping"] | null) {
  if (!mapping || mapping.status === "NEEDS_REVIEW" || mapping.targetKind === "UNMAPPED") {
    return "needs-review";
  }
  if (mapping.status === "CONFIRMED") {
    return "confirmed";
  }
  return "proposed";
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "not available";
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

type TreeCounts = {
  assemblies: number;
  parts: number;
};

function treeCounts(node: CadStepTreeNode): TreeCounts {
  return node.children.reduce(
    (counts, child) => {
      const childCounts = treeCounts(child);
      return {
        assemblies: counts.assemblies + 1 + childCounts.assemblies,
        parts: counts.parts + childCounts.parts,
      };
    },
    {
      assemblies: 0,
      parts: node.partInstances.reduce((total, instance) => total + Math.max(instance.quantity, 1), 0),
    },
  );
}

function isGroupedPartInstance(
  instance: CadStepTreePartInstanceRecord,
): instance is Extract<CadStepTreePartInstanceRecord, { kind: "part_instance_group" }> {
  return "kind" in instance && instance.kind === "part_instance_group";
}

function partInstanceKey(instance: CadStepTreePartInstanceRecord) {
  return isGroupedPartInstance(instance) ? instance.groupId : instance.id;
}

function PartInstanceRow({ instance }: { instance: CadStepTreePartInstanceRecord }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!isGroupedPartInstance(instance)) {
    return (
      <li data-mapping={mappingTone(instance.mapping)}>
        <span>{instance.partDefinition?.name ?? instance.instancePath}</span>
        <small>qty {instance.quantity}</small>
      </li>
    );
  }

  const toggleLabel = `${isExpanded ? "Collapse" : "Expand"} ${instance.displayName} repeated instances`;

  return (
    <li data-mapping={mappingTone(instance.mapping)} data-grouped="true">
      <div className="cad-tree-part-group-row">
        <button
          aria-expanded={isExpanded}
          aria-label={toggleLabel}
          className="cad-tree-fold-button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={toggleLabel}
          type="button"
        >
          <span data-expanded={isExpanded}>
            <IconChevronRight />
          </span>
        </button>
        <span>{instance.displayName}</span>
        <small>{"\u00d7"}{instance.quantity}</small>
      </div>
      {isExpanded ? (
        <ul className="cad-tree-part-group-instances">
          {instance.instancePaths.map((instancePath, index) => (
            <li key={`${instance.groupId}-${instancePath}`}>
              <span>{instancePath.split("/").filter(Boolean).at(-1) ?? instancePath}</span>
              <small>{instance.instanceIds[index] ?? instancePath}</small>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function TreeNode({ node }: { node: CadStepTreeNode }) {
  const [isExpanded, setIsExpanded] = useState(node.depth === 0);
  const counts = treeCounts(node);
  const hasNestedItems = node.children.length > 0 || node.partInstances.length > 0;
  const toggleLabel = `${isExpanded ? "Collapse" : "Expand"} ${node.name} branch`;

  return (
    <li className="cad-tree-node" data-mapping={mappingTone(node.mapping)}>
      <div className="cad-tree-node-main">
        <div className="cad-tree-node-title-row">
          {hasNestedItems ? (
            <button
              aria-expanded={isExpanded}
              aria-label={toggleLabel}
              className="cad-tree-fold-button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={toggleLabel}
              type="button"
            >
              <span data-expanded={isExpanded}>
                <IconChevronRight />
              </span>
            </button>
          ) : <span className="cad-tree-fold-spacer" />}
          <strong>{node.name}</strong>
        </div>
        <div className="cad-tree-counts">
          <span>{pluralize(counts.assemblies, "assembly", "assemblies")}</span>
          <span>{pluralize(counts.parts, "part", "parts")}</span>
        </div>
        <span>{node.inferredType.replace(/_/g, " ").toLowerCase()}</span>
        <code>{node.instancePath}</code>
      </div>
      {isExpanded && node.partInstances.length ? (
        <ul className="cad-tree-parts">
          {node.partInstances.map((instance) => (
            <PartInstanceRow instance={instance} key={partInstanceKey(instance)} />
          ))}
        </ul>
      ) : null}
      {isExpanded && node.children.length ? (
        <ul className="cad-tree-children">
          {node.children.map((child) => <TreeNode key={child.id} node={child} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function CadStepTreePanel({
  importRun,
  isViewingOlderSnapshot,
  tree,
}: {
  importRun: CadStepImportRunRecord | null;
  isViewingOlderSnapshot: boolean;
  tree: CadStepTreeNode[];
}) {
  return (
    <section className="cad-card">
      <div className="cad-section-heading">
        <span className="cad-eyebrow">Detected hierarchy</span>
        <h3>Assembly tree</h3>
      </div>
      {importRun ? (
        <dl className="cad-tree-import-meta">
          <div><dt>Imported file</dt><dd>{importRun.originalFilename}</dd></div>
          <div><dt>Import created</dt><dd>{formatDate(importRun.createdAt)}</dd></div>
        </dl>
      ) : null}
      {isViewingOlderSnapshot ? (
        <p className="cad-old-snapshot-alert" role="status">You are viewing an older CAD snapshot.</p>
      ) : null}
      {tree.length ? (
        <ul className="cad-step-tree">{tree.map((node) => <TreeNode key={node.id} node={node} />)}</ul>
      ) : <p className="cad-empty-copy">Upload a STEP file to inspect the detected assembly tree.</p>}
    </section>
  );
}
