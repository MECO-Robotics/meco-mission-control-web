import type {
  TaskCalendarEvent,
  TaskCalendarEventType,
} from "./taskCalendarEvents";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TASK_CALENDAR_EVENT_FILTER_OPTIONS: Array<{
  label: string;
  value: "all" | TaskCalendarEventType;
}> = [
  { label: "All events", value: "all" },
  { label: "Milestones", value: "milestone" },
  { label: "Task due", value: "task-due" },
  { label: "Waiting QA", value: "qa-due" },
  { label: "Manufacturing due", value: "manufacturing-due" },
  { label: "Meetings / events", value: "event" },
];

export const TASK_CALENDAR_SORT_OPTIONS = [
  { label: "Date", value: "date" },
  { label: "Category", value: "category" },
  { label: "Priority", value: "priority" },
] as const;

const TASK_CALENDAR_EVENT_TYPE_SORT_ORDER: Record<TaskCalendarEventType, number> = {
  milestone: 0,
  "task-due": 1,
  "qa-due": 2,
  "manufacturing-due": 3,
  event: 4,
};

const TASK_CALENDAR_PRIORITY_SORT_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CALENDAR_DEFAULT_PRIORITY_ORDER = 9;

export type TaskCalendarSortMode = (typeof TASK_CALENDAR_SORT_OPTIONS)[number]["value"];

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toEventDateKey(start: string) {
  const calendarDateMatch = start.match(/^(\d{4}-\d{2}-\d{2})/);
  if (calendarDateMatch) {
    return calendarDateMatch[1];
  }

  const parsed = new Date(start);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = `${parsed.getUTCMonth() + 1}`.padStart(2, "0");
    const day = `${parsed.getUTCDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return start.slice(0, 10);
}

export function createMonthCells(cursor: Date) {
  const startOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const endOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - startOfMonth.getDay());
  const totalSlots = Math.ceil((startOfMonth.getDay() + endOfMonth.getDate()) / 7) * 7;

  return Array.from({ length: totalSlots }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return cellDate;
  });
}

function compareTaskCalendarEventsByDate(left: TaskCalendarEvent, right: TaskCalendarEvent) {
  const leftStart = new Date(left.start).getTime();
  const rightStart = new Date(right.start).getTime();

  if (leftStart === rightStart) {
    return left.title.localeCompare(right.title);
  }

  return leftStart - rightStart;
}

function compareTaskCalendarEventsByCategory(left: TaskCalendarEvent, right: TaskCalendarEvent) {
  const leftType = TASK_CALENDAR_EVENT_TYPE_SORT_ORDER[left.extendedProps.type];
  const rightType = TASK_CALENDAR_EVENT_TYPE_SORT_ORDER[right.extendedProps.type];
  if (leftType !== rightType) {
    return leftType - rightType;
  }

  return compareTaskCalendarEventsByDate(left, right);
}

function compareTaskCalendarEventsByPriority(left: TaskCalendarEvent, right: TaskCalendarEvent) {
  const leftPriority =
    TASK_CALENDAR_PRIORITY_SORT_ORDER[left.extendedProps.priority ?? ""] ??
    CALENDAR_DEFAULT_PRIORITY_ORDER;
  const rightPriority =
    TASK_CALENDAR_PRIORITY_SORT_ORDER[right.extendedProps.priority ?? ""] ??
    CALENDAR_DEFAULT_PRIORITY_ORDER;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return compareTaskCalendarEventsByCategory(left, right);
}

export function sortTaskCalendarEvents(
  events: TaskCalendarEvent[],
  sortMode: TaskCalendarSortMode,
) {
  const sortedEvents = [...events];

  if (sortMode === "category") {
    sortedEvents.sort(compareTaskCalendarEventsByCategory);
    return sortedEvents;
  }

  if (sortMode === "priority") {
    sortedEvents.sort(compareTaskCalendarEventsByPriority);
    return sortedEvents;
  }

  sortedEvents.sort(compareTaskCalendarEventsByDate);
  return sortedEvents;
}
