import type { TaskRecord } from "@/types/recordsExecution";
import type { AttentionQueueRow } from "../attention/attentionQueue";
import type { HomePressureGroup } from "./homePressureModel";

export type HomeWorkloadState = "attention" | "not-started" | "in-progress" | "waiting-for-qa";
export const HOME_WORKLOAD_STATES: readonly { id: HomeWorkloadState; label: string; tone: string }[] = [
  { id: "attention", label: "Needs attention", tone: "danger" },
  { id: "not-started", label: "Not started", tone: "neutral" },
  { id: "in-progress", label: "In progress", tone: "info" },
  { id: "waiting-for-qa", label: "Waiting for QA", tone: "warning" },
];
const attentionSignals = new Set(["blocked", "overdue", "waiting-qa", "due-soon"]);

export interface HomeWorkloadRow {
  id: string;
  label: string;
  tasks: TaskRecord[];
  tasksByState: Record<HomeWorkloadState, TaskRecord[]>;
  risks: AttentionQueueRow[];
}
export interface HomeWorkloadModel {
  rows: HomeWorkloadRow[];
  taskCount: number;
  attentionCount: number;
  risks: AttentionQueueRow[];
  hasSharedAssignments: boolean;
}

export function buildHomeWorkloadModel({ tasks, groups }: {
  tasks: readonly TaskRecord[];
  groups: readonly HomePressureGroup[];
}): HomeWorkloadModel {
  const taskById = new Map(tasks.filter(task => task.status !== "complete").map(task => [task.id, task]));
  const taskIds = new Set<string>();
  const attentionIds = new Set<string>();
  const risks = new Map<string, AttentionQueueRow>();
  const rows = groups.flatMap(group => {
    const row: HomeWorkloadRow = { id: group.id, label: group.label, tasks: [], risks: [],
      tasksByState: { attention: [], "not-started": [], "in-progress": [], "waiting-for-qa": [] } };
    const seen = new Set<string>();
    for (const item of group.items) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      if (item.source === "risk") {
        row.risks.push(item);
        risks.set(item.key, item);
        continue;
      }
      const task = taskById.get(item.recordId);
      if (!task || task.status === "complete") continue;
      row.tasks.push(task);
      taskIds.add(task.id);
      const state = item.signals.some(signal => attentionSignals.has(signal)) ? "attention" : task.status;
      row.tasksByState[state].push(task);
      if (state === "attention") attentionIds.add(task.id);
    }
    return row.tasks.length || row.risks.length ? [row] : [];
  }).sort((left, right) => right.tasks.length - left.tasks.length || right.risks.length - left.risks.length
    || left.label.localeCompare(right.label) || left.id.localeCompare(right.id));
  return { rows, taskCount: taskIds.size, attentionCount: attentionIds.size, risks: [...risks.values()],
    hasSharedAssignments: rows.reduce((sum, row) => sum + row.tasks.length + row.risks.length, 0) > taskIds.size + risks.size };
}
