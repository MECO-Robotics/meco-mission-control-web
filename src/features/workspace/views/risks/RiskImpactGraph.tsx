import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import { buildRiskImpactGraph, type RiskGraphSelection } from "./riskImpactGraph";
import "./riskImpactGraph.css";

export function RiskImpactGraph({ bootstrap, selected, onOpenRecord }: {
  bootstrap: BootstrapPayload;
  selected: RiskGraphSelection;
  onOpenRecord: (kind: string, id: string) => void;
}) {
  const graph = useMemo(() => buildRiskImpactGraph(bootstrap, selected), [bootstrap, selected]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const rootKey = `${selected.kind}:${selected.id}`;
  const expanded = expandedKey === rootKey;
  const root = graph.nodes.find((node) => node.key === rootKey);
  const nearby = [root!];
  const included = new Set([rootKey]);
  for (let index = 0; index < nearby.length && nearby.length < 30; index++) {
    const key = nearby[index].key;
    const neighbors = graph.edges.flatMap((edge) => edge.from === key ? [edge.to] : edge.to === key ? [edge.from] : []).sort();
    for (const neighbor of neighbors) {
      if (included.has(neighbor) || nearby.length >= 30) continue;
      included.add(neighbor);
      nearby.push(graph.nodes.find((node) => node.key === neighbor)!);
    }
  }
  const visible = expanded || graph.nodes.length <= 30 ? graph.nodes : nearby;
  const layers = [...new Set(visible.map((node) => node.layer))].sort((a, b) => a - b);
  const positions = new Map<string, { x: number; y: number }>();
  let maxRows = 1;
  for (const [column, layer] of layers.entries()) {
    const columnNodes = visible.filter((node) => node.layer === layer);
    maxRows = Math.max(maxRows, columnNodes.length);
    columnNodes.forEach((node, row) => positions.set(node.key, { x: column * 300 + 12, y: row * 112 + 24 }));
  }
  const width = Math.max(240, layers.length * 300 - 60);
  const height = maxRows * 112 + 20;
  const arrowId = useId();
  useEffect(() => {
    const scroll = scrollRef.current;
    const active = scroll?.querySelector<HTMLElement>(".risk-impact-node.is-selected");
    if (scroll && active) scroll.scrollLeft = Math.max(0, active.offsetLeft - (scroll.clientWidth - active.offsetWidth) / 2);
  }, [rootKey]);
  return <section className="risk-impact" aria-label="Linked work and dependencies">
    <h3>Linked work and dependencies</h3>
    <p className="risk-impact-counts">{graph.directlyBlockedTaskCount} directly blocked tasks · {graph.downstreamTaskCount} downstream unfinished tasks · {graph.nodes.length} records</p>
    {graph.hasCycle ? <p className="risk-impact-cycle" role="status">A dependency cycle is present. Review the linked prerequisites.</p> : null}
    <div ref={scrollRef} className="risk-impact-scroll" tabIndex={0} role="region" aria-label="Dependency diagram; scroll to explore linked records">
      <div className="risk-impact-canvas" style={{ width, height }}>
        <svg width={width} height={height} aria-hidden="true">
          <defs><marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
          {graph.edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            const right = to.x >= from.x;
            const x1 = from.x + (right ? 208 : 0);
            const x2 = to.x + (right ? 0 : 208);
            const y1 = from.y + 36;
            const y2 = to.y + 36;
            const bend = (x1 + x2) / 2;
            return <g className={edge.label === "blocks" ? "risk-impact-edge is-blocking" : "risk-impact-edge"} key={`${edge.from}:${edge.label}:${edge.to}`}>
              <path d={`M ${x1} ${y1} H ${bend} V ${y2} H ${x2}`} markerEnd={`url(#${arrowId})`} />
              <text x={bend} y={(y1 + y2) / 2 - 6} textAnchor="middle">{edge.label}</text>
            </g>;
          })}
        </svg>
        {visible.map((node) => {
          const position = positions.get(node.key)!;
          return <button key={node.key} className={`risk-impact-node${node.key === rootKey ? " is-selected" : ""}`} style={{ left: position.x, top: position.y }} type="button" disabled={!node.available} onClick={() => onOpenRecord(node.kind, node.id)}>
            <small>{node.kind}{!node.available ? " · unavailable" : ""}</small><strong>{node.label}</strong>
          </button>;
        })}
      </div>
    </div>
    {graph.nodes.length > 30 ? <button className="ghost-button" type="button" onClick={() => setExpandedKey(expanded ? null : rootKey)}>{expanded ? "Show first 30 records" : `Show all ${graph.nodes.length} records`}</button> : null}
    <details className="risk-impact-relations"><summary>Read all {graph.edges.length} relationships</summary>
      {graph.edges.length ? <ul>{graph.edges.map((edge) => {
        const from = graph.nodes.find((node) => node.key === edge.from)!;
        const to = graph.nodes.find((node) => node.key === edge.to)!;
        return <li key={`${edge.from}:${edge.label}:${edge.to}`}><span>{from.label}</span> <strong>{edge.label}</strong> <button className="ghost-button" type="button" disabled={!to.available} onClick={() => onOpenRecord(to.kind, to.id)}>{to.label}{!to.available ? " (unavailable)" : ""}</button></li>;
      })}</ul> : <p>No explicit linked work or prerequisites.</p>}
    </details>
  </section>;
}
