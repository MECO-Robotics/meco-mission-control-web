import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

function taskCommand(payload: Partial<TaskPayload>) {
  const command = { ...payload };
  delete command.taskDependencies;
  delete command.taskBlockers;
  delete command.targetRiskId;
  return command;
}

export function createTask(payload: TaskPayload, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, Partial<TaskPayload>>("/tasks", "POST", taskCommand(payload), onUnauthorized);
}

export function updateTaskRecord(
  taskId: string,
  payload: Partial<TaskPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskRecord, Partial<TaskPayload>>(
    `/tasks/${taskId}`,
    "PATCH",
    taskCommand(payload),
    onUnauthorized,
  );
}

export function deleteTaskRecord(taskId: string, onUnauthorized?: () => void) {
  return requestItem<TaskRecord, never>(`/tasks/${taskId}`, "DELETE", undefined, onUnauthorized);
}
