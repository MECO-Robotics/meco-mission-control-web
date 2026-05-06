import * as React from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TaskStatus } from "@/types/common";

import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";

import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import {
  getTaskOpenBlockersForTask,
  getTaskWaitingOnDependencies,
} from "@/features/workspace/shared/task/taskPlanning";

export type TaskQueueBoardState = TaskStatus | "blocked" | "waiting-on-dependency";
export const TASK_QUEUE_LAZY_LOAD_BATCH_SIZE = 15;

export interface TaskQueueBoardColumn {
  label: string;
  state: TaskQueueBoardState;
}

export const TASK_QUEUE_BOARD_COLUMNS: readonly TaskQueueBoardColumn[] = [
  { state: "not-started", label: "Not started" },
  { state: "in-progress", label: "In progress" },
  { state: "blocked", label: "Blocked" },
  { state: "waiting-on-dependency", label: "Waiting on dependency" },
  { state: "waiting-for-qa", label: "QA" },
  { state: "complete", label: "Complete" },
] as const;

export const TASK_QUEUE_STATUS_OPTIONS: DropdownOption[] = [
  ...(["not-started", "in-progress", "waiting-for-qa", "complete"] as const).map((status) => ({
    id: status,
    name:
      status === "not-started"
        ? "Not started"
        : status === "in-progress"
          ? "In progress"
          : status === "waiting-for-qa"
            ? "QA"
            : "Complete",
    icon: React.createElement(TimelineTaskStatusLogo, {
      compact: true,
      signal: status as TimelineTaskStatusSignal,
      status,
    }),
  })),
  {
    id: "blocked",
    name: "Blocked",
    icon: React.createElement(TimelineTaskStatusLogo, {
      compact: true,
      signal: "blocked",
      status: "not-started" as TaskStatus,
    }),
  },
  {
    id: "waiting-on-dependency",
    name: "Waiting on dependency",
    icon: React.createElement(TimelineTaskStatusLogo, {
      compact: true,
      signal: "waiting-on-dependency",
      status: "not-started" as TaskStatus,
    }),
  },
] as const;

const BOARD_STATE_SORT_VALUES: Record<TaskQueueBoardState, number> = {
  "not-started": 1,
  "in-progress": 2,
  blocked: 3,
  "waiting-on-dependency": 4,
  "waiting-for-qa": 5,
  complete: 6,
};

export function getTaskQueueBoardState(
  task: TaskRecord,
  bootstrap: BootstrapPayload,
): TaskQueueBoardState {
  if (getTaskOpenBlockersForTask(task.id, bootstrap).length > 0) {
    return "blocked";
  }

  if (task.isWaitingOnDependency || getTaskWaitingOnDependencies(task.id, bootstrap).length > 0) {
    return "waiting-on-dependency";
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
    case "waiting-on-dependency":
      return "Waiting on dependency";
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
    "waiting-on-dependency": [],
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
