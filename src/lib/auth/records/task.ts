import type { TaskPatchPayload, TaskPayload } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

function taskCommand<T extends { taskDependencies?: TaskPayload["taskDependencies"] }>(payload: T): Omit<T, "taskDependencies"> {
  const { taskDependencies: _taskDependencies, ...command } = payload;
  return command;
}

export function createTask(payload: TaskPayload, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, Partial<TaskPayload>>("/tasks", "POST", taskCommand(payload), onUnauthorized);
}

export function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPatchPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskRecord, Partial<TaskPatchPayload>>(
    `/tasks/${taskId}`,
    "PATCH",
    taskCommand(payload),
    onUnauthorized,
  );
}

export function deleteTaskRecord(taskId: string, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, never>(`/tasks/${taskId}`, "DELETE", undefined, onUnauthorized);
}
