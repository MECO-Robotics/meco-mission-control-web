import { useState } from "react";
import { ChevronRight } from "lucide-react";
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

export function CadAssemblyTree({ meshes, root, selected, onSelect }: {
  meshes: CadMesh[];
  root: CadAssemblyNode;
  selected: number | null;
  onSelect: (meshIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const tree = buildTreeNode(root, meshes);
  tree.label = "<robot>";

  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const renderNode = (node: TreeNode) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    return <li key={node.id}>
      <div className="cad-assembly-tree-row">
        {hasChildren ? <button type="button" className={`cad-assembly-tree-toggle${isExpanded ? " is-expanded" : ""}`} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={isExpanded} onClick={() => toggle(node.id)}><ChevronRight aria-hidden="true" size={15} /></button> : <span className="cad-assembly-tree-spacer" />}
        <button type="button" className="cad-assembly-tree-label" aria-current={node.meshIndex === selected ? "true" : undefined} onClick={() => {
          if (node.meshIndex !== undefined) onSelect(node.meshIndex);
          else if (hasChildren) toggle(node.id);
        }}>{node.label}</button>
      </div>
      {hasChildren && isExpanded ? <ul>{node.children.map(renderNode)}</ul> : null}
    </li>;
  };

  return <nav className="cad-assembly-tree" aria-label="CAD assembly hierarchy">
    <ul>{renderNode(tree)}</ul>
  </nav>;
}
