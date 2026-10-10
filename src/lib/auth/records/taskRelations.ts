import type { TaskDependencyPayload } from "@/types/payloads/task";
import type { TaskDependencyRecord } from "@/types/recordsExecution";
import { requestItem } from "./common";

export function createTaskDependencyRecord(
  payload: TaskDependencyPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, TaskDependencyPayload>(
    "/task-dependencies",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateTaskDependencyRecord(
  dependencyId: string,
  payload: Partial<TaskDependencyPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, Partial<TaskDependencyPayload>>(
    `/task-dependencies/${dependencyId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskDependencyRecord(
  dependencyId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskDependencyRecord, never>(
    `/task-dependencies/${dependencyId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}
