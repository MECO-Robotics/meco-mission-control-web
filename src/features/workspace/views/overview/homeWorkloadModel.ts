import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { getTaskOpenBlockersForTask, getTaskWaitingOnDependencyRecords } from "@/features/workspace/shared/task/taskPlanning";

export type HomeWorkloadMode = "team" | "individual";
export type HomeWorkloadState = "blocked" | "waiting-on-dependency" | "not-started" | "in-progress" | "waiting-for-qa";

export const HOME_WORKLOAD_STATES: readonly { id: HomeWorkloadState; label: string; tone: string }[] = [
  { id: "blocked", label: "Blocked", tone: "danger" },
  { id: "waiting-on-dependency", label: "Waiting on dependency", tone: "warning" },
  { id: "not-started", label: "Not started", tone: "neutral" },
  { id: "in-progress", label: "In progress", tone: "info" },
  { id: "waiting-for-qa", label: "Waiting for QA", tone: "warning" },
];

export interface HomeWorkloadRow {
  id: string;
  label: string;
  tasks: TaskRecord[];
  tasksByState: Record<HomeWorkloadState, TaskRecord[]>;
}

export interface HomeWorkloadModel {
  rows: HomeWorkloadRow[];
  taskCount: number;
  hasSharedAssignments: boolean;
}

export function buildHomeWorkloadModel({ tasks, bootstrap, mode }: {
  tasks: readonly TaskRecord[];
  bootstrap: BootstrapPayload;
  mode: HomeWorkloadMode;
}): HomeWorkloadModel {
  const groups = new Map(bootstrap.responsibleGroups.map(group => [group.id, group]));
  const members = new Map(bootstrap.members.map(member => [member.id, member]));
  const rows = new Map<string, HomeWorkloadRow>();
  const seen = new Set<string>();
  let hasSharedAssignments = false;
  for (const task of tasks) {
    if (task.status === "complete" || seen.has(task.id)) continue;
    seen.add(task.id);
    const assignments = mode === "team"
      ? (task.responsibleGroupId ? [task.responsibleGroupId] : [])
      : [...new Set([task.ownerId, ...task.assigneeIds].filter((id): id is string => Boolean(id)))];
    if (assignments.length > 1) hasSharedAssignments = true;
    const state = task.isBlocked || getTaskOpenBlockersForTask(task.id, bootstrap).length
      ? "blocked" : getTaskWaitingOnDependencyRecords(task.id, bootstrap).length
        ? "waiting-on-dependency" : task.status;
    for (const assignment of assignments.length ? assignments : [null]) {
      const id = assignment ? `${mode === "team" ? "team" : "person"}:${assignment}` : `unassigned:${mode}`;
      let row = rows.get(id);
      if (!row) {
        const label = !assignment ? "Unassigned" : mode === "team"
          ? groups.get(assignment)?.name ?? `Unavailable team · ${assignment}`
          : members.get(assignment)?.name ?? `Unavailable person · ${assignment}`;
        row = { id, label, tasks: [], tasksByState: { blocked: [], "waiting-on-dependency": [], "not-started": [], "in-progress": [], "waiting-for-qa": [] } };
        rows.set(id, row);
      }
      row.tasks.push(task);
      row.tasksByState[state].push(task);
    }
  }
  return {
    rows: [...rows.values()].sort((left, right) => right.tasks.length - left.tasks.length || left.label.localeCompare(right.label) || left.id.localeCompare(right.id)),
    taskCount: seen.size,
    hasSharedAssignments,
  };
}
