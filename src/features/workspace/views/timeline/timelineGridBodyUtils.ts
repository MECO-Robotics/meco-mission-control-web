import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import { getTaskOpenBlockersForTask, getTaskWaitingOnDependencies } from "@/features/workspace/shared/task/taskPlanning";

export type TimelineTaskStatusSignal = TaskStatus | "blocked" | "waiting-on-dependency";

function getTimelineTaskStatusSignalForTask(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  if (getTaskOpenBlockersForTask(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnDependencies(task.id, bootstrap).length > 0) {
    return "waiting-on-dependency";
  }

  return task.status;
}

export function getTimelineTaskStatusSignal(
  task: BootstrapPayload["tasks"][number],
  bootstrap: BootstrapPayload,
): TimelineTaskStatusSignal {
  return getTimelineTaskStatusSignalForTask(task, bootstrap);
}
