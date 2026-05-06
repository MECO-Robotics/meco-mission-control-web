import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

export function createTask(payload: TaskPayload, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, TaskPayload>("/tasks", "POST", payload, onUnauthorized);
}

export function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskRecord, Partial<TaskPayload>>(
    `/tasks/${taskId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskRecord(taskId: string, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, never>(`/tasks/${taskId}`, "DELETE", undefined, onUnauthorized);
}
