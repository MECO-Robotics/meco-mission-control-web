import { normalizeTaskBlockerRecord } from "../bootstrap/task-blockers";
import type { TaskBlockerPayload, TaskDependencyPayload } from "@/types/payloads";
import type { TaskBlockerResponse, TaskDependencyRecord } from "@/types/recordsExecution";
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
  return requestItem<TaskBlockerResponse, TaskBlockerPayload>(
    "/task-blockers",
    "POST",
    payload,
    onUnauthorized,
  ).then((record) => normalizeTaskBlockerRecord(record));
}

export function updateTaskBlockerRecord(
  blockerId: string,
  payload: Partial<TaskBlockerPayload>,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerResponse, Partial<TaskBlockerPayload>>(
    `/task-blockers/${blockerId}`,
    "PATCH",
    payload,
    onUnauthorized,
  ).then((record) => normalizeTaskBlockerRecord(record));
}

export function deleteTaskBlockerRecord(
  blockerId: string,
  onUnauthorized?: () => void,
) {
  return requestItem<TaskBlockerResponse, never>(
    `/task-blockers/${blockerId}`,
    "DELETE",
    undefined,
    onUnauthorized,
  ).then((record) => normalizeTaskBlockerRecord(record));
}
