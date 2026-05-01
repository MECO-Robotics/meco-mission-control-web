import type { BootstrapPayload, TaskRecord, TaskStatus } from "@/types";

import {
  getTaskOpenBlockersForTask,
  getTaskWaitingOnTasks,
} from "@/features/workspace/shared/taskPlanning";

export type TaskQueueBoardState = TaskStatus | "blocked";
export const TASK_QUEUE_LAZY_LOAD_BATCH_SIZE = 15;

export interface TaskQueueBoardColumn {
  label: string;
  state: TaskQueueBoardState;
}

export const TASK_QUEUE_BOARD_COLUMNS: readonly TaskQueueBoardColumn[] = [
  { state: "not-started", label: "Not started" },
  { state: "in-progress", label: "In progress" },
  { state: "blocked", label: "Blocked" },
  { state: "waiting-for-qa", label: "QA" },
  { state: "complete", label: "Complete" },
] as const;

const BOARD_STATE_SORT_VALUES: Record<TaskQueueBoardState, number> = {
  "not-started": 1,
  "in-progress": 2,
  blocked: 3,
  "waiting-for-qa": 4,
  complete: 5,
};

export function getTaskQueueBoardState(
  task: TaskRecord,
  bootstrap: BootstrapPayload,
): TaskQueueBoardState {
  if (getTaskOpenBlockersForTask(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (getTaskWaitingOnTasks(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (task.status === "complete") {
    return "complete";
  }

  return task.status;
}

export function formatTaskQueueBoardState(state: TaskQueueBoardState) {
  switch (state) {
    case "not-started":
      return "Not started";
    case "in-progress":
      return "In progress";
    case "blocked":
      return "Blocked";
    case "waiting-for-qa":
      return "QA";
    case "complete":
      return "Complete";
    default:
      return state;
  }
}

export function groupTasksByBoardState(
  tasks: TaskRecord[],
  bootstrap: BootstrapPayload,
) {
  const grouped: Record<TaskQueueBoardState, TaskRecord[]> = {
    "not-started": [],
    "in-progress": [],
    blocked: [],
    "waiting-for-qa": [],
    complete: [],
  };

  tasks.forEach((task) => {
    const boardState = getTaskQueueBoardState(task, bootstrap);
    grouped[boardState].push(task);
  });

  return grouped;
}

export function getTaskQueueBoardStateSortValue(state: TaskQueueBoardState) {
  return BOARD_STATE_SORT_VALUES[state];
}
