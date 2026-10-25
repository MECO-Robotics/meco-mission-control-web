import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskDependencyRecord, TaskRecord } from "@/types/recordsExecution";
import { getTaskWaitingOnDependencyRecords } from "@/features/workspace/shared/task/taskPlanning";
import { getTaskPartInstanceLabel } from "@/features/workspace/shared/task/taskTargeting";
import { formatIterationVersion } from "@/lib/appUtils/common";

export interface HomeDependencySelection { kind: TaskDependencyRecord["kind"]; id: string }
export interface HomeDependencyBranch {
  key: string;
  selection: HomeDependencySelection;
  label: string;
  available: boolean;
  outsideScope: boolean;
  hasCycle: boolean;
  waitingTaskIds: string[];
  dependencies: TaskDependencyRecord[];
}
export interface HomeDependencyModel { branches: HomeDependencyBranch[]; waitingTaskCount: number; hasCycle: boolean }

export function buildHomeDependencyModel(tasks: TaskRecord[], bootstrap: BootstrapPayload): HomeDependencyModel {
  const taskById = new Map(bootstrap.tasks.map(task => [task.id, task]));
  const taskScope = new Set(tasks.map(task => task.id));
  const definitions = Object.fromEntries(bootstrap.partDefinitions.map(part => [part.id, part]));
  const waitingByTask = new Map<string, TaskDependencyRecord[]>();
  const waitingFor = (id: string) => {
    let dependencies = waitingByTask.get(id);
    if (!dependencies) {
      dependencies = getTaskWaitingOnDependencyRecords(id, bootstrap);
      waitingByTask.set(id, dependencies);
    }
    return dependencies;
  };
  // Only task links can recurse. Retain the links themselves when a cycle is found.
  const reachesCycle = (id: string, path: Set<string>, visited: Set<string>): boolean => {
    if (path.has(id)) return true;
    if (visited.has(id) || !taskById.has(id) || taskById.get(id)?.status === "complete") return false;
    visited.add(id);
    path.add(id);
    const cyclic = waitingFor(id).some(dependency => dependency.kind === "task" && reachesCycle(dependency.refId, path, visited));
    path.delete(id);
    return cyclic;
  };
  const branches = new Map<string, HomeDependencyBranch>();
  const waitingTasks = new Set<string>();
  for (const task of tasks) {
    if (task.status === "complete") continue;
    for (const dependency of waitingFor(task.id)) {
      waitingTasks.add(task.id);
      const key = `${dependency.kind}:${dependency.refId}`;
      let branch = branches.get(key);
      if (!branch) {
        const record = dependency.kind === "task" ? taskById.get(dependency.refId)
          : dependency.kind === "milestone" ? bootstrap.milestones.find(item => item.id === dependency.refId)
          : bootstrap.partInstances.find(item => item.id === dependency.refId);
        const label = !record ? `Unavailable ${dependency.kind} · ${dependency.refId}` : dependency.kind === "part-instance"
          ? getTaskPartInstanceLabel(bootstrap.partInstances.find(item => item.id === dependency.refId)!, definitions, formatIterationVersion)
          : "title" in record ? record.title : dependency.refId;
        branch = { key, selection: { kind: dependency.kind, id: dependency.refId }, label, available: Boolean(record),
          outsideScope: dependency.kind === "task" && !taskScope.has(dependency.refId),
          hasCycle: dependency.kind === "task" && reachesCycle(dependency.refId, new Set(), new Set()),
          waitingTaskIds: [], dependencies: [] };
        branches.set(key, branch);
      }
      if (!branch.waitingTaskIds.includes(task.id)) branch.waitingTaskIds.push(task.id);
      branch.dependencies.push(dependency);
    }
  }
  const ordered = [...branches.values()].sort((a, b) => b.waitingTaskIds.length - a.waitingTaskIds.length || a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
  return { branches: ordered, waitingTaskCount: waitingTasks.size, hasCycle: ordered.some(branch => branch.hasCycle) };
}
