import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface OverviewListItem {
  id: string;
  title: string;
  meta: string;
  tone?: "critical" | "warning" | "neutral";
  taskId?: string;
}

export interface HomeViewModel {
  upcomingMilestones: OverviewListItem[];
  priorityTasks: OverviewListItem[];
}

function dateKey(value: string) {
  return value.includes("T") ? value.slice(0, 10) : value;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function daysFromToday(value: string, today: Date) {
  const target = new Date(`${dateKey(value)}T00:00:00`).getTime();
  return Math.round((target - startOfLocalDay(today)) / MS_PER_DAY);
}

function isOpenTask(task: TaskRecord) {
  return task.status !== "complete";
}

function relativeDueLabel(days: number) {
  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `Due in ${days}d`;
}

function buildLookups(bootstrap: BootstrapPayload) {
  return {
    projectsById: Object.fromEntries(bootstrap.projects.map((item) => [item.id, item.name])),
    subsystemsById: Object.fromEntries(bootstrap.subsystems.map((item) => [item.id, item.name])),
    workstreamsById: Object.fromEntries(bootstrap.workstreams.map((item) => [item.id, item.name])),
  };
}

function taskMeta(task: TaskRecord, lookups: ReturnType<typeof buildLookups>, today: Date) {
  const parts = [
    relativeDueLabel(daysFromToday(task.dueDate, today)),
    lookups.projectsById[task.projectId],
    lookups.workstreamsById[task.workstreamId ?? ""],
    lookups.subsystemsById[task.subsystemId],
  ].filter(Boolean);

  return parts.join(" | ");
}

function taskToItem(task: TaskRecord, lookups: ReturnType<typeof buildLookups>, today: Date): OverviewListItem {
  const days = daysFromToday(task.dueDate, today);
  return {
    id: task.id,
    meta: taskMeta(task, lookups, today),
    taskId: task.id,
    title: task.title,
    tone: days < 0 || task.priority === "critical" ? "critical" : days <= 1 ? "warning" : "neutral",
  };
}

function milestoneToItem(
  milestone: BootstrapPayload["milestones"][number],
  today: Date,
): OverviewListItem {
  const days = daysFromToday(milestone.startDateTime, today);
  return {
    id: milestone.id,
    meta: `${relativeDueLabel(days)} | ${milestone.type}`,
    title: milestone.title,
    tone: days <= 3 ? "warning" : "neutral",
  };
}

function sortTasksByDueDate(tasks: TaskRecord[]) {
  return [...tasks].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export function buildHomeViewModel(bootstrap: BootstrapPayload, today = new Date()): HomeViewModel {
  const lookups = buildLookups(bootstrap);
  const openTasks = bootstrap.tasks.filter(isOpenTask);
  const dueSoonTasks = openTasks.filter((task) => {
    const days = daysFromToday(task.dueDate, today);
    return days >= 0 && days <= 7;
  });
  const overdueTasks = openTasks.filter((task) => daysFromToday(task.dueDate, today) < 0);

  const upcomingMilestones = bootstrap.milestones
    .filter((milestone) => {
      const days = daysFromToday(milestone.startDateTime, today);
      return days >= 0 && days <= 14;
    })
    .sort((left, right) => left.startDateTime.localeCompare(right.startDateTime))
    .slice(0, 4)
    .map((milestone) => milestoneToItem(milestone, today));

  return {
    priorityTasks: sortTasksByDueDate([...overdueTasks, ...dueSoonTasks])
      .slice(0, 5)
      .map((task) => taskToItem(task, lookups, today)),
    upcomingMilestones,

  };
}
