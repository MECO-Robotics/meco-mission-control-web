import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { resolveWorkspaceColor } from "@/features/workspace/shared/model/workspaceColors";
import { getTimelineTaskDisciplineColor } from "../timeline/model/timelineTaskColors";
import { readTaskSubsystemIds, readTaskWorkstreamIds } from "./taskQueueKanbanCard";

export type TaskQueueGroupBy = "team" | "subsystem";
export const DEFAULT_TASK_QUEUE_GROUP_BY: TaskQueueGroupBy = "team";
export const TASK_QUEUE_GROUP_OPTIONS = [
  { id: "team", name: "Team" },
  { id: "subsystem", name: "Subsystem" },
] as const;

export interface TaskQueueLaneLabel {
  name: string;
  kind: "team" | "subsystem" | "workstream";
  code?: string;
  accentColor: string;
}

export interface TaskQueueSwimlane {
  id: string;
  label: TaskQueueLaneLabel;
  tasks: TaskRecord[];
}

export function groupTaskQueueSwimlanes(
  tasks: TaskRecord[],
  bootstrap: BootstrapPayload,
  groupBy: TaskQueueGroupBy = DEFAULT_TASK_QUEUE_GROUP_BY,
) {
  const tasksByProject = new Map<string, TaskRecord[]>();
  for (const task of tasks) {
    const group = tasksByProject.get(task.projectId);
    if (group) group.push(task);
    else tasksByProject.set(task.projectId, [task]);
  }
  const workTypesById = Object.fromEntries(bootstrap.workTypes.map((record) => [record.id, record]));
  const projectOrder = [...new Set([...bootstrap.projects.map(({ id }) => id), ...tasksByProject.keys()])];
  return projectOrder.flatMap((projectId) => {
    const projectTasks = tasksByProject.get(projectId);
    if (!projectTasks) return [];
    const project = bootstrap.projects.find(({ id }) => id === projectId);
    const isRobot = project?.projectType === "robot";
    const kind = groupBy === "team" ? "team" : isRobot ? "subsystem" : "workstream";
    const labels = new Map<string, TaskQueueLaneLabel>(groupBy === "team"
      ? bootstrap.workTypes.map((record) => [record.id, {
          name: record.name, kind, code: record.code,
          accentColor: getTimelineTaskDisciplineColor(record.id, workTypesById),
        }])
      : (isRobot ? bootstrap.subsystems : bootstrap.workstreams)
          .filter((record) => record.projectId === projectId)
          .map((record) => [record.id, {
            name: record.name, kind, accentColor: resolveWorkspaceColor(record.color, record.id),
          }]));
    const groups = new Map<string, TaskQueueSwimlane>();
    for (const task of projectTasks) {
      const ids = groupBy === "team" ? [task.workTypeId || ""]
        : isRobot ? readTaskSubsystemIds(task) : readTaskWorkstreamIds(task);
      for (const id of ids.length ? ids : [""]) {
        let lane = groups.get(id);
        if (!lane) {
          lane = {
            id: `${kind}:${id}`,
            label: labels.get(id) ?? {
              name: `${id ? "Unavailable" : "Unassigned"} ${kind}`,
              kind, accentColor: "var(--text-copy)",
            },
            tasks: [],
          };
          groups.set(id, lane);
        }
        lane.tasks.push(task);
      }
    }
    const laneOrder = [...new Set([...labels.keys(), ...groups.keys()])];
    return [{
      id: projectId,
      projectName: project?.name ?? "Unavailable project",
      lanes: laneOrder.flatMap((id) => groups.has(id) ? [groups.get(id)!] : []),
    }];
  });
}
