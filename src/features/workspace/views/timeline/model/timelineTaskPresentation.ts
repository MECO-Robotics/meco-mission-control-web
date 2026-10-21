import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { dateDiffInDays } from "@/lib/appUtils/common";
import { localTodayDate } from "@/features/workspace/shared/timeline/timelineDateUtils";
import { isTaskDependencySatisfied } from "@/features/workspace/shared/task/taskPlanningInternals";
import { buildTimelineTaskStatusSignalByTaskId, type TimelineTaskStatusSignal } from "../timelineGridBodyUtils";
import { getTimelineTaskStatusLabel } from "../TimelineTaskStatusLogo";

export interface TimelineDependencyItem {
  id: string;
  direction: "Prerequisite" | "Dependent";
  label: string;
  state: string;
  task?: TaskRecord;
}
export interface TimelineTaskPresentation {
  signal: TimelineTaskStatusSignal;
  statusLabel: string;
  overdueDays: number;
  overdueLabel: string;
  discipline: string;
  description: string;
  dependencies: TimelineDependencyItem[];
}
export function buildTimelineTaskPresentations(bootstrap: BootstrapPayload, today = localTodayDate()) {
  const signals = buildTimelineTaskStatusSignalByTaskId(bootstrap);
  const tasks = new Map(bootstrap.tasks.map((task) => [task.id, task]));
  const disciplines = new Map(bootstrap.workTypes.map((type) => [type.id, type.name]));
  const result: Record<string, TimelineTaskPresentation> = {};
  for (const task of bootstrap.tasks) {
    const signal = signals[task.id];
    const statusLabel = signal === "waiting-on-dependency" ? "Waiting" : getTimelineTaskStatusLabel(signal);
    const overdueDays = task.status !== "complete" && task.dueDate < today ? dateDiffInDays(task.dueDate, today) : 0;
    const overdueLabel = overdueDays ? `Overdue · ${overdueDays} ${overdueDays === 1 ? "day" : "days"}` : "";
    result[task.id] = { signal, statusLabel, overdueDays, overdueLabel,
      discipline: disciplines.get(task.workTypeId) ?? "Unspecified discipline",
      description: [task.title, getTimelineTaskStatusLabel(signal), `${task.startDate} – ${task.dueDate}`, overdueLabel].filter(Boolean).join(" · "),
      dependencies: [],
    };
  }
  for (const dependency of bootstrap.taskDependencies ?? []) {
    const prerequisite = dependency.kind === "task" ? tasks.get(dependency.refId) : undefined;
    const milestone = dependency.kind === "milestone" ? bootstrap.milestones.find((item) => item.id === dependency.refId) : undefined;
    const part = dependency.kind === "part-instance" ? bootstrap.partInstances.find((item) => item.id === dependency.refId) : undefined;
    const available = prerequisite ?? milestone ?? part;
    const label = prerequisite?.title ?? milestone?.title ?? (part ? `Part ${part.id}` : `Unavailable ${dependency.kind}: ${dependency.refId}`);
    const state = !available ? "Unavailable" : dependency.dependencyType === "soft" ? "Advisory" : isTaskDependencySatisfied(dependency, bootstrap) ? "Satisfied" : "Waiting";
    result[dependency.taskId]?.dependencies.push({ id: dependency.id, direction: "Prerequisite", label, state, task: prerequisite });
    if (dependency.kind === "task" && result[dependency.refId]) {
      const dependent = tasks.get(dependency.taskId);
      result[dependency.refId].dependencies.push({ id: dependency.id, direction: "Dependent",
        label: dependent?.title ?? `Unavailable task: ${dependency.taskId}`,
        state: dependent ? result[dependent.id].statusLabel : "Unavailable", task: dependent });
    }
  }
  return result;
}
