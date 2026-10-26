import { addDaysToLocalDate, localTodayDate, parseLocalDate } from "@/lib/dateUtils";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";

export interface HomeDeadlineBucket {
  key: string;
  tasks: TaskRecord[];
  milestones: MilestoneRecord[];
}

export interface HomeDeadlineModel {
  days: HomeDeadlineBucket[];
  overdue: HomeDeadlineBucket;
  maxTaskCount: number;
}

export function buildHomeDeadlineModel({ tasks, milestones, today }: {
  tasks: readonly TaskRecord[];
  milestones: readonly MilestoneRecord[];
  today: Date;
}): HomeDeadlineModel {
  const start = localTodayDate(today);
  const days = Array.from({ length: 14 }, (_, index): HomeDeadlineBucket => ({
    key: addDaysToLocalDate(start, index), tasks: [], milestones: [],
  }));
  const buckets = new Map(days.map(day => [day.key, day]));
  const overdue: HomeDeadlineBucket = { key: "overdue", tasks: [], milestones: [] };
  const bucketFor = (key: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !parseLocalDate(key)) return undefined;
    return key < start ? overdue : buckets.get(key);
  };
  for (const task of tasks) {
    if (task.status !== "complete" && task.dueDate) bucketFor(task.dueDate)?.tasks.push(task);
  }
  for (const milestone of milestones) {
    if (milestone.status !== "complete" && (milestone.date || milestone.startAt)) bucketFor((milestone.date ?? milestone.startAt)!.slice(0, 10))?.milestones.push(milestone);
  }
  return { days, overdue, maxTaskCount: Math.max(0, ...days.map(day => day.tasks.length)) };
}
