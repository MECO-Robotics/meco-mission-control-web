import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import { getTaskOpenBlockersForTask, getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";

export type TimelineTaskStatusSignal = TaskStatus | "blocked" | "waiting-on-dependency";

export function getTimelineTaskStatusSignal(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  if (task.status === "complete") return "complete";

  if (task.isBlocked || getTaskOpenBlockersForTask(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencies(task.id, bootstrap).length > 0) {
    return "waiting-on-dependency";
  }

  return task.status;
}

export function buildTimelineTaskStatusSignalByTaskId(
  bootstrap: BootstrapPayload,
): Record<string, TimelineTaskStatusSignal> {
  return Object.fromEntries(
    bootstrap.tasks.map((task) => [
      task.id,
      getTimelineTaskStatusSignal(task, bootstrap),
    ]),
  );
}
