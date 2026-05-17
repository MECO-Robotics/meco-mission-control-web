import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { RiskRecord } from "@/types/recordsReporting";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface OverviewMetric {
  id: string;
  label: string;
  value: number;
  tone?: "critical" | "warning" | "good";
}

export interface OverviewListItem {
  id: string;
  title: string;
  meta: string;
  tone?: "critical" | "warning" | "neutral";
  taskId?: string;
}

export interface OverviewGraphSegment {
  id: string;
  label: string;
  value: number;
  tone: "critical" | "warning" | "good" | "neutral";
}

export interface OverviewBarDatum {
  id: string;
  label: string;
  value: number;
  tone: "critical" | "warning" | "good" | "neutral";
}

export interface HomeViewModel {
  metrics: OverviewMetric[];
  schedulePressure: OverviewGraphSegment[];
  workBySubsystem: OverviewBarDatum[];
  upcomingMilestones: OverviewListItem[];
  priorityTasks: OverviewListItem[];
  issues: OverviewListItem[];
}

export interface TodayViewModel {
  dailyActions: OverviewListItem[];
  verySoonDeadlines: OverviewListItem[];
  issues: OverviewListItem[];
  summary: OverviewMetric[];
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

function isBlockedTask(task: TaskRecord) {
  return (
    task.isBlocked ||
    task.blockers.length > 0 ||
    task.planningState === "blocked" ||
    task.planningState === "waiting-on-dependency"
  );
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

function riskToItem(risk: RiskRecord): OverviewListItem {
  return {
    id: risk.id,
    meta: risk.mitigationTaskId ? "High risk with mitigation linked" : "High risk needs mitigation",
    title: risk.title,
    tone: risk.mitigationTaskId ? "warning" : "critical",
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

function buildSchedulePressure(openTasks: TaskRecord[], today: Date): OverviewGraphSegment[] {
  const overdue = openTasks.filter((task) => daysFromToday(task.dueDate, today) < 0).length;
  const dueSoon = openTasks.filter((task) => {
    const days = daysFromToday(task.dueDate, today);
    return days >= 0 && days <= 7;
  }).length;
  const later = Math.max(openTasks.length - overdue - dueSoon, 0);

  return [
    { id: "overdue", label: "Overdue", value: overdue, tone: "critical" },
    { id: "due-soon", label: "Due soon", value: dueSoon, tone: "warning" },
    { id: "later", label: "Later", value: later, tone: "good" },
  ];
}

function buildWorkBySubsystem(
  openTasks: TaskRecord[],
  lookups: ReturnType<typeof buildLookups>,
): OverviewBarDatum[] {
  const counts = new Map<string, { id: string; label: string; value: number }>();

  openTasks.forEach((task) => {
    const id = task.subsystemId || "unassigned";
    const label = lookups.subsystemsById[task.subsystemId] ?? "Unassigned";
    const current = counts.get(id) ?? { id, label, value: 0 };
    counts.set(id, { ...current, value: current.value + 1 });
  });

  return [...counts.values()]
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      tone: index === 0 ? "warning" : "neutral",
    }));
}

export function buildHomeViewModel(bootstrap: BootstrapPayload, today = new Date()): HomeViewModel {
  const lookups = buildLookups(bootstrap);
  const openTasks = bootstrap.tasks.filter(isOpenTask);
  const dueSoonTasks = openTasks.filter((task) => {
    const days = daysFromToday(task.dueDate, today);
    return days >= 0 && days <= 7;
  });
  const overdueTasks = openTasks.filter((task) => daysFromToday(task.dueDate, today) < 0);
  const highRisks = bootstrap.risks.filter((risk) => risk.severity === "high");
  const blockedTasks = openTasks.filter(isBlockedTask);

  const upcomingMilestones = bootstrap.milestones
    .filter((milestone) => {
      const days = daysFromToday(milestone.startDateTime, today);
      return days >= 0 && days <= 14;
    })
    .sort((left, right) => left.startDateTime.localeCompare(right.startDateTime))
    .slice(0, 4)
    .map((milestone) => milestoneToItem(milestone, today));

  return {
    metrics: [
      { id: "open-work", label: "Open work", value: openTasks.length },
      { id: "due-soon", label: "Due soon", value: dueSoonTasks.length, tone: "warning" },
      { id: "overdue", label: "Overdue", value: overdueTasks.length, tone: overdueTasks.length > 0 ? "critical" : "good" },
      { id: "high-risks", label: "High risks", value: highRisks.length, tone: highRisks.length > 0 ? "critical" : "good" },
    ],
    schedulePressure: buildSchedulePressure(openTasks, today),
    workBySubsystem: buildWorkBySubsystem(openTasks, lookups),
    priorityTasks: sortTasksByDueDate([...overdueTasks, ...dueSoonTasks])
      .slice(0, 5)
      .map((task) => taskToItem(task, lookups, today)),
    upcomingMilestones,
    issues: [
      ...highRisks.map(riskToItem),
      ...blockedTasks.map((task) => taskToItem(task, lookups, today)),
    ].slice(0, 5),
  };
}

export function buildTodayViewModel(bootstrap: BootstrapPayload, today = new Date()): TodayViewModel {
  const lookups = buildLookups(bootstrap);
  const openTasks = bootstrap.tasks.filter(isOpenTask);
  const dailyTasks = sortTasksByDueDate(
    openTasks.filter((task) => daysFromToday(task.dueDate, today) <= 0),
  );
  const verySoonTasks = sortTasksByDueDate(
    openTasks.filter((task) => {
      const days = daysFromToday(task.dueDate, today);
      return days > 0 && days <= 3;
    }),
  );
  const verySoonMilestones = bootstrap.milestones.filter((milestone) => {
    const days = daysFromToday(milestone.startDateTime, today);
    return days >= 0 && days <= 3;
  });
  const highRisks = bootstrap.risks.filter((risk) => risk.severity === "high");
  const blockedTasks = openTasks.filter(isBlockedTask);

  return {
    dailyActions: dailyTasks.slice(0, 6).map((task) => taskToItem(task, lookups, today)),
    verySoonDeadlines: [
      ...verySoonTasks.map((task) => taskToItem(task, lookups, today)),
      ...verySoonMilestones.map((milestone) => milestoneToItem(milestone, today)),
    ].slice(0, 6),
    issues: [
      ...highRisks.map(riskToItem),
      ...blockedTasks.map((task) => taskToItem(task, lookups, today)),
    ].slice(0, 6),
    summary: [
      { id: "daily-actions", label: "Daily action items", value: dailyTasks.length, tone: dailyTasks.length > 0 ? "warning" : "good" },
      { id: "very-soon", label: "Very soon deadlines", value: verySoonTasks.length + verySoonMilestones.length, tone: "warning" },
      { id: "issues", label: "Issues", value: highRisks.length + blockedTasks.length, tone: highRisks.length > 0 ? "critical" : "warning" },
    ],
  };
}
