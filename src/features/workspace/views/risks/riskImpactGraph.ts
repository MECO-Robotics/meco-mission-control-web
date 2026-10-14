import type { BootstrapPayload } from "@/types/bootstrap";
import type { DomainReference } from "@/types/common";
import { getRiskAffectedTaskIds, getRiskRecordReference } from "../riskViewData/riskRecordLinks";

export interface RiskGraphSelection { kind: "risk" | "task"; id: string }
export interface RiskImpactNode { key: string; label: string; kind: string; id: string; available: boolean; layer: number }
export interface RiskImpactEdge { from: string; to: string; label: "attached to" | "blocks" | "mitigated by" | "depends on" | "associated work" }
export interface RiskImpactGraphData {
  nodes: RiskImpactNode[];
  edges: RiskImpactEdge[];
  directlyBlockedTaskCount: number;
  downstreamTaskCount: number;
  hasCycle: boolean;
}

export function buildRiskImpactGraph(bootstrap: BootstrapPayload, selected: RiskGraphSelection): RiskImpactGraphData {
  const tasks = new Map(bootstrap.tasks.map((task) => [task.id, task]));
  const nodes = new Map<string, RiskImpactNode>();
  const edges = new Map<string, RiskImpactEdge>();
  const dependencies = [...bootstrap.taskDependencies].filter((dependency) => dependency.dependencyType === "hard").sort((a, b) => a.id.localeCompare(b.id));
  const addNode = (ref: DomainReference, layer: number) => {
    const record = getRiskRecordReference(ref, bootstrap);
    if (!nodes.has(record.key)) nodes.set(record.key, { key: record.key, label: record.label, kind: record.kind, id: record.id, available: record.available, layer });
    return record;
  };
  const addEdge = (from: string, to: string, label: RiskImpactEdge["label"]) => edges.set(`${from}|${label}|${to}`, { from, to, label });
  const root = addNode(selected, 0);
  const risk = selected.kind === "risk" ? bootstrap.risks.find((record) => record.id === selected.id) : undefined;
  const seeds = new Set<string>(selected.kind === "task" ? [selected.id] : risk ? getRiskAffectedTaskIds(risk, bootstrap) : []);
  const directlyBlocked = new Set<string>();
  if (risk) {
    const attachments = [...risk.relatedTargets, ...(risk.source.kind === "manual" ? [] : [risk.source])];
    for (const ref of attachments.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
      const record = addNode(ref, ref.kind === "task" ? 1 : -1);
      const blocks = ref.kind === "task" && risk.relatedTargets.some((target) => target.kind === "task" && target.id === ref.id) && risk.blocksWork && risk.status !== "resolved";
      addEdge(root.key, record.key, blocks ? "blocks" : "attached to");
      if (blocks && tasks.has(ref.id) && tasks.get(ref.id)?.status !== "complete") directlyBlocked.add(ref.id);
      if (ref.kind !== "task") for (const taskId of [...record.taskIds].sort()) {
        const task = addNode({ kind: "task", id: taskId }, 1);
        addEdge(record.key, task.key, "associated work");
      }
    }
    if (risk.mitigationTaskId) {
      const task = addNode({ kind: "task", id: risk.mitigationTaskId }, 1);
      addEdge(root.key, task.key, "mitigated by");
    }
  }
  if (selected.kind === "task") {
    for (const linkedRisk of [...bootstrap.risks].sort((a, b) => a.id.localeCompare(b.id))) {
      if (linkedRisk.mitigationTaskId !== selected.id && !getRiskAffectedTaskIds(linkedRisk, bootstrap).includes(selected.id)) continue;
      const riskNode = addNode({ kind: "risk", id: linkedRisk.id }, -1);
      const blocks = linkedRisk.blocksWork && linkedRisk.status !== "resolved" && linkedRisk.relatedTargets.some((target) => target.kind === "task" && target.id === selected.id);
      addEdge(riskNode.key, root.key, blocks ? "blocks" : linkedRisk.mitigationTaskId === selected.id ? "mitigated by" : "attached to");
      if (blocks && tasks.get(selected.id)?.status !== "complete" && tasks.has(selected.id)) directlyBlocked.add(selected.id);
      if (blocks && linkedRisk.mitigationTaskId === selected.id) addEdge(riskNode.key, root.key, "mitigated by");
      const refs = [...linkedRisk.relatedTargets, ...(linkedRisk.source.kind === "manual" ? [] : [linkedRisk.source])];
      for (const ref of refs.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
        if (ref.kind === "task" || !getRiskRecordReference(ref, bootstrap).taskIds.includes(selected.id)) continue;
        const context = addNode(ref, -2);
        addEdge(riskNode.key, context.key, "attached to");
        addEdge(context.key, root.key, "associated work");
      }
    }
    const supplyRefs: DomainReference[] = bootstrap.purchaseItems.filter((purchase) => purchase.taskId === selected.id).map((purchase) => ({ kind: "purchase-item", id: purchase.id }));
    if (tasks.get(selected.id)?.manufacturingDetails) supplyRefs.push({ kind: "manufacturing-details", id: selected.id });
    for (const ref of supplyRefs.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
      const context = addNode(ref, -1);
      addEdge(context.key, root.key, "associated work");
    }
  }
  for (const id of [...seeds].sort()) {
    const task = addNode({ kind: "task", id }, selected.kind === "task" ? 0 : 1);
    if (selected.kind === "risk" && ![...edges.values()].some((edge) => edge.to === task.key)) addEdge(root.key, task.key, "associated work");
  }
  const downstream = new Set<string>();
  const visited = new Set<string>();
  const queue = [...seeds].sort();
  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const parent = nodes.get(`task:${id}`)!;
    for (const dependency of dependencies.filter((record) => record.kind === "task" && record.refId === id)) {
      const dependent = tasks.get(dependency.taskId);
      if (dependent?.status === "complete") continue;
      const node = addNode({ kind: "task", id: dependency.taskId }, parent.layer + 1);
      addEdge(node.key, parent.key, "depends on");
      if (dependent && !seeds.has(dependent.id)) downstream.add(dependent.id);
      queue.push(dependency.taskId);
    }
  }
  const upstreamVisited = new Set<string>();
  const upstream = [...nodes.values()].filter((node) => node.kind === "task").map((node) => node.id);
  while (upstream.length) {
    const id = upstream.shift()!;
    if (upstreamVisited.has(id)) continue;
    upstreamVisited.add(id);
    const node = nodes.get(`task:${id}`)!;
    for (const dependency of dependencies.filter((record) => record.taskId === id)) {
      const prerequisite = addNode({ kind: dependency.kind, id: dependency.refId }, node.layer - 1);
      addEdge(node.key, prerequisite.key, "depends on");
      if (dependency.kind === "task") upstream.push(dependency.refId);
    }
  }
  let hasCycle = false;
  const complete = new Set<string>();
  const visiting = new Set<string>();
  const checkCycle = (key: string) => {
    if (visiting.has(key)) { hasCycle = true; return; }
    if (complete.has(key)) return;
    visiting.add(key);
    for (const edge of edges.values()) if (edge.from === key && edge.label === "depends on") checkCycle(edge.to);
    visiting.delete(key);
    complete.add(key);
  };
  for (const key of nodes.keys()) checkCycle(key);
  if (!hasCycle) {
    // A task reached by several paths belongs after its longest prerequisite path.
    for (let pass = 0; pass < nodes.size; pass++) {
      let changed = false;
      for (const edge of edges.values()) {
        if (edge.label !== "depends on") continue;
        const dependent = nodes.get(edge.from)!;
        const prerequisite = nodes.get(edge.to)!;
        if (dependent.layer > prerequisite.layer) continue;
        dependent.layer = prerequisite.layer + 1;
        changed = true;
      }
      if (!changed) break;
    }
  }
  return { nodes: [...nodes.values()].sort((a, b) => a.layer - b.layer || a.key.localeCompare(b.key)), edges: [...edges.values()].sort((a, b) => `${a.from}|${a.to}|${a.label}`.localeCompare(`${b.from}|${b.to}|${b.label}`)), directlyBlockedTaskCount: directlyBlocked.size, downstreamTaskCount: downstream.size, hasCycle };
}
