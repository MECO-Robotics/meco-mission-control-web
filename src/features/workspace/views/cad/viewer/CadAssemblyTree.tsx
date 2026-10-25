import { useState } from "react";
import { Box, Boxes, ChevronRight } from "lucide-react";
import type { CadAssemblyNode, CadMesh } from "./cadGeometry";

interface TreeNode {
  id: string;
  label: string;
  meshIndex?: number;
  children: TreeNode[];
}

function buildTreeNode(node: CadAssemblyNode, meshes: CadMesh[]): TreeNode {
  const children = node.children.map((child) => buildTreeNode(child, meshes));
  const directMeshes = node.meshIndices.map((meshIndex) => ({
    id: `${node.id}:mesh:${meshIndex}`,
    label: meshes[meshIndex]?.name || `Part ${meshIndex + 1}`,
    meshIndex,
    children: [],
  }));
  const label = node.name.trim() || (node.id === "root" ? "<robot>" : "Assembly");
  if (node.id !== "root" && children.length === 0 && directMeshes.length === 1) {
    return { id: node.id, label, meshIndex: directMeshes[0].meshIndex, children: [] };
  }
  return {
    id: node.id,
    label,
    children: [...children, ...directMeshes],
  };
}

function filterTree(node: TreeNode, query: string): TreeNode | null {
  if (!query) return node;
  if (node.meshIndex !== undefined) return node.label.toLowerCase().includes(query) ? node : null;
  if (node.label.toLowerCase().includes(query)) return node;
  const children = node.children.map((child) => filterTree(child, query)).filter((child): child is TreeNode => child !== null);
  return children.length ? { ...node, children } : null;
}

export function CadAssemblyTree({ meshes, root, search = "", selected, onSelect }: {
  meshes: CadMesh[];
  root: CadAssemblyNode;
  search?: string;
  selected: number | null;
  onSelect: (meshIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const query = search.trim().toLowerCase();
  const sourceTree = buildTreeNode(root, meshes);
  sourceTree.label = "<robot>";
  const tree = filterTree(sourceTree, query) ?? { ...sourceTree, children: [] };
  const noMatches = query.length > 0 && tree.children.length === 0;

  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const renderNode = (node: TreeNode) => {
    const isExpanded = query.length > 0 || expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    return <li key={node.id}>
      <div className="cad-assembly-tree-row">
        {hasChildren ? <button type="button" className={`cad-assembly-tree-toggle${isExpanded ? " is-expanded" : ""}`} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={isExpanded} onClick={() => toggle(node.id)}><ChevronRight aria-hidden="true" size={15} /></button> : <span className="cad-assembly-tree-spacer" />}
        <button type="button" className="cad-assembly-tree-label" aria-current={node.meshIndex === selected ? "true" : undefined} onClick={() => {
          if (node.meshIndex !== undefined) onSelect(node.meshIndex);
          else if (hasChildren) toggle(node.id);
        }}>{hasChildren ? <Boxes aria-hidden="true" size={14} /> : <Box aria-hidden="true" size={14} />}<span>{node.label}</span></button>
      </div>
      {hasChildren && isExpanded ? <ul>{node.children.map(renderNode)}</ul> : null}
    </li>;
  };

  return <nav className="cad-assembly-tree" aria-label="CAD assembly browser">
    <div className="cad-assembly-tree-header">Browser</div>
    <div className="cad-assembly-tree-content">
      <ul>{renderNode(tree)}</ul>
      {noMatches ? <p className="cad-assembly-tree-empty">No components match “{search.trim()}”.</p> : null}
    </div>
  </nav>;
}
