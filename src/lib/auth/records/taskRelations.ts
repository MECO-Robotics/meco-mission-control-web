import type { TaskBlockerPayload, TaskDependencyPayload } from "@/types/payloads";
import type { TaskBlockerRecord, TaskDependencyRecord } from "@/types/recordsExecution";
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

export function createTaskBlockerRecord(
  payload: TaskBlockerPayload,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, TaskBlockerPayload>(
    "/task-blockers",
    "POST",
    payload,
    onUnauthorized,
  );
}

export function updateTaskBlockerRecord(
  blockerId: string,
  payload: Partial<TaskBlockerPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, Partial<TaskBlockerPayload>>(
    `/task-blockers/${blockerId}`,
    "PATCH",
    payload,
    onUnauthorized,
  );
}

export function deleteTaskBlockerRecord(
  blockerId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerRecord, never>(
    `/task-blockers/${blockerId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  );
}
