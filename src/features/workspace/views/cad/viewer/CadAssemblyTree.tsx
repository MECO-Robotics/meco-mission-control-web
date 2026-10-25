import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { CadMesh } from "./cadGeometry";

interface TreeNode {
  id: string;
  label: string;
  meshIndex?: number;
  children: TreeNode[];
}

function buildTree(meshes: CadMesh[]) {
  const root: TreeNode = { id: "robot", label: "<robot>", children: [] };
  meshes.forEach((mesh, meshIndex) => {
    let parent = root;
    const path = [...(mesh.hierarchy ?? []), mesh.name.trim() || `Part ${meshIndex + 1}`];
    path.forEach((label, depth) => {
      const id = `${parent.id}/${label}`;
      let child = parent.children.find((item) => item.label === label);
      if (!child) {
        child = { id, label, children: [] };
        parent.children.push(child);
      }
      if (depth === path.length - 1) child.meshIndex ??= meshIndex;
      parent = child;
    });
  });
  return root;
}

export function CadAssemblyTree({ meshes, selected, onSelect }: {
  meshes: CadMesh[];
  selected: number | null;
  onSelect: (meshIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const root = buildTree(meshes);

  const renderNode = (node: TreeNode) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    return <li key={node.id}>
      <div className="cad-assembly-tree-row">
        {hasChildren ? <button type="button" className={`cad-assembly-tree-toggle${isExpanded ? " is-expanded" : ""}`} aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={isExpanded} onClick={() => setExpanded((current) => {
          const next = new Set(current);
          if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
          return next;
        })}><ChevronRight aria-hidden="true" size={15} /></button> : <span className="cad-assembly-tree-spacer" />}
        <button type="button" className="cad-assembly-tree-label" aria-current={node.meshIndex === selected ? "true" : undefined} onClick={() => {
          if (hasChildren) setExpanded((current) => new Set(current).add(node.id));
          else if (node.meshIndex !== undefined) onSelect(node.meshIndex);
        }}>{node.label}</button>
      </div>
      {hasChildren && isExpanded ? <ul>{node.children.map(renderNode)}</ul> : null}
    </li>;
  };

  return <nav className="cad-assembly-tree" aria-label="CAD assembly hierarchy">
    <ul>{renderNode(root)}</ul>
  </nav>;
}
