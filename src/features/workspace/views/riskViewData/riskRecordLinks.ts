import type { BootstrapPayload } from "@/types/bootstrap";
import type { RiskRecord } from "@/types/recordsReporting";

type Reference = { kind: string; id: string };
const evidenceContextKinds = new Set(["project", "workstream", "responsible-group", "milestone", "meeting", "event"]);
export interface RiskRecordReference extends Reference {
  key: string;
  label: string;
  taskIds: string[];
  available: boolean;
}

// Follow stored associations only. The visited set also protects malformed cyclic references.
export function getRiskRecordReference(ref: Reference, bootstrap: BootstrapPayload, visited = new Set<string>()): RiskRecordReference {
  const key = `${ref.kind}:${ref.id}`;
  const missing = { ...ref, key, label: `Unavailable ${ref.kind} · ${ref.id}`, taskIds: [], available: false };
  if (visited.has(key)) return missing;
  const seen = new Set(visited).add(key);
  const tasks = bootstrap.tasks;
  const linked = (refs: Reference[]) => refs.flatMap(target => getRiskRecordReference(target, bootstrap, seen).taskIds);
  const taskIdsForParts = (partIds: string[]) => tasks.filter(task => task.partInstanceIds.some(id => partIds.includes(id))).map(task => task.id);
  let record: { id: string } | undefined;
  let name: string | undefined;
  let labelKind = ref.kind;
  let taskIds: string[] = [];
  switch (ref.kind) {
    case "task": case "manufacturing-details": {
      const task = tasks.find(task => task.id === ref.id && (ref.kind === "task" || task.manufacturingDetails));
      record = task; name = task?.title; labelKind = ref.kind === "task" ? "Task" : "Manufacturing"; taskIds = task ? [task.id] : []; break;
    }
    case "purchase-item": {
      const purchase = bootstrap.purchaseItems.find(item => item.id === ref.id);
      record = purchase; name = purchase?.title; labelKind = "Purchase"; taskIds = purchase ? [purchase.taskId] : []; break;
    }
    case "project": record = bootstrap.projects.find(item => item.id === ref.id); name = bootstrap.projects.find(item => item.id === ref.id)?.name; taskIds = tasks.filter(task => task.projectId === ref.id).map(task => task.id); break;
    case "workstream": record = bootstrap.workstreams.find(item => item.id === ref.id); name = bootstrap.workstreams.find(item => item.id === ref.id)?.name; taskIds = tasks.filter(task => task.workstreamIds.includes(ref.id)).map(task => task.id); break;
    case "responsible-group": record = bootstrap.responsibleGroups.find(item => item.id === ref.id); name = bootstrap.responsibleGroups.find(item => item.id === ref.id)?.name; taskIds = tasks.filter(task => task.responsibleGroupId === ref.id).map(task => task.id); break;
    case "subsystem": case "mechanism": {
      const area = ref.kind === "subsystem" ? bootstrap.subsystems.find(item => item.id === ref.id) : bootstrap.mechanisms.find(item => item.id === ref.id);
      record = area; name = area?.name;
      const partIds = bootstrap.partInstances.filter(part => ref.kind === "subsystem" ? part.intendedSubsystemId === ref.id : part.intendedMechanismId === ref.id).map(part => part.id);
      taskIds = [...tasks.filter(task => (ref.kind === "subsystem" ? task.subsystemIds : task.mechanismIds).includes(ref.id)).map(task => task.id), ...taskIdsForParts(partIds)]; break;
    }
    case "part-instance": {
      const part = bootstrap.partInstances.find(item => item.id === ref.id);
      record = part; name = part ? `${bootstrap.partDefinitions.find(item => item.id === part.partDefinitionId)?.name ?? "Part"} · ${part.id}` : undefined; taskIds = taskIdsForParts([ref.id]); break;
    }
    case "part-definition": case "material": {
      const entity = ref.kind === "material" ? bootstrap.materials.find(item => item.id === ref.id) : bootstrap.partDefinitions.find(item => item.id === ref.id);
      record = entity; name = entity?.name;
      const definitions = ref.kind === "part-definition" ? [ref.id] : bootstrap.partDefinitions.filter(part => part.materialId === ref.id).map(part => part.id);
      taskIds = taskIdsForParts(bootstrap.partInstances.filter(part => definitions.includes(part.partDefinitionId)).map(part => part.id));
      for (const task of tasks) {
        const details = task.manufacturingDetails;
        if (details && ((details.part.kind === "part-definition" && definitions.includes(details.part.partDefinitionId)) || (ref.kind === "material" && details.material.kind === "inventory-material" && details.material.materialId === ref.id))) taskIds.push(task.id);
      }
      taskIds.push(...bootstrap.purchaseItems.filter(item => (item.partDefinitionId && definitions.includes(item.partDefinitionId)) || (ref.kind === "material" && item.materialId === ref.id)).map(item => item.taskId)); break;
    }
    case "report": case "qa-finding": case "test-finding": case "qa-request": case "test-result": case "artifact": {
      const entity = ref.kind === "report" ? bootstrap.reports.find(item => item.id === ref.id) : ref.kind === "qa-finding" ? bootstrap.qaFindings.find(item => item.id === ref.id) : ref.kind === "test-finding" ? bootstrap.testFindings.find(item => item.id === ref.id) : ref.kind === "qa-request" ? bootstrap.qaRequests.find(item => item.id === ref.id) : ref.kind === "test-result" ? bootstrap.testResults.find(item => item.id === ref.id) : bootstrap.artifacts.find(item => item.id === ref.id);
      record = entity; name = entity && ("title" in entity ? entity.title : "subject" in entity ? entity.subject : entity.summary);
      // Evidence can describe a whole review or project. Only concrete subjects identify affected work.
      taskIds = entity ? linked(entity.targetRefs.filter(target => !evidenceContextKinds.has(target.kind))) : []; break;
    }
    case "task-dependency": {
      const dependency = bootstrap.taskDependencies.find(item => item.id === ref.id);
      record = dependency; name = dependency ? tasks.find(task => task.id === dependency.taskId)?.title : undefined; taskIds = dependency ? [dependency.taskId] : []; break;
    }
    case "milestone": case "meeting": case "event": {
      const entity = ref.kind === "milestone" ? bootstrap.milestones.find(item => item.id === ref.id) : ref.kind === "meeting" ? bootstrap.meetings.find(item => item.id === ref.id) : bootstrap.events.find(item => item.id === ref.id);
      record = entity; name = entity?.title;
      taskIds = tasks.filter(task => task.scheduleRefs.some(target => target.kind === ref.kind && target.id === ref.id)).map(task => task.id); break;
    }
    case "vendor": { const vendor = bootstrap.vendors.find(item => item.id === ref.id); record = vendor; name = vendor?.name; taskIds = bootstrap.purchaseItems.filter(item => item.quotes.some(quote => quote.vendorId === ref.id)).map(item => item.taskId); break; }
    case "risk": { const risk = bootstrap.risks.find(item => item.id === ref.id); record = risk; name = risk?.title; taskIds = risk ? linked([...risk.relatedTargets, ...(risk.source.kind === "manual" ? [] : [risk.source])]) : []; break; }
    case "design-iteration": { const iteration = bootstrap.designIterations?.find(item => item.id === ref.id); record = iteration; name = iteration?.title; taskIds = iteration?.taskId ? [iteration.taskId] : []; break; }
  }
  if (!record) return missing;
  const validTasks = new Set(tasks.map(task => task.id));
  return { ...ref, key, label: `${labelKind.charAt(0).toUpperCase() + labelKind.slice(1).replaceAll("-", " ")} · ${name || ref.id}`, available: true, taskIds: [...new Set(taskIds)].filter(id => validTasks.has(id)) };
}

export function getRiskAffectedTaskIds(risk: RiskRecord, bootstrap: BootstrapPayload): string[] {
  const refs: Reference[] = [...risk.relatedTargets, ...(risk.source.kind === "manual" ? [] : [risk.source])];
  return [...new Set(refs.flatMap(ref => getRiskRecordReference(ref, bootstrap).taskIds))];
}
