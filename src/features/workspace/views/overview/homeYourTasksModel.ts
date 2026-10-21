import { parseLocalDate } from "@/lib/dateUtils";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { TaskRecord } from "@/types/recordsExecution";

export function parseHomeTaskDueDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : null;
}

export function buildHomeYourTasks(tasks: readonly TaskRecord[], signedInMemberId: string | null): TaskRecord[] {
  if (!signedInMemberId) return [];
  const priorities = new Map(TASK_PRIORITY_OPTIONS.map((option, index) => [option.id, index]));
  const unique = new Map(tasks.filter(task => task.status !== "complete"
    && (task.ownerId === signedInMemberId || task.assigneeIds.includes(signedInMemberId))).map(task => [task.id, task]));
  return [...unique.values()].map(task => ({ task, due: parseHomeTaskDueDate(task.dueDate) ? task.dueDate : "9999-99-99" }))
    .sort((left, right) => (priorities.get(left.task.priority) ?? Infinity) - (priorities.get(right.task.priority) ?? Infinity)
      || left.due.localeCompare(right.due) || left.task.title.localeCompare(right.task.title) || left.task.id.localeCompare(right.task.id))
    .map(item => item.task);
}
