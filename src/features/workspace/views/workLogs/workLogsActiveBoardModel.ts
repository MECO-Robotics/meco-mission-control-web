import type { TaskRecord, WorkLogRecord } from "@/types/recordsExecution";

export const WORKLOG_ACTIVE_BOARD_COLUMNS = [
  {
    state: "active",
    label: "Active",
    emptyTitle: "No active worklogs",
    emptyCopy: "In-progress task logs land here when students are actively working.",
  },
  {
    state: "paused",
    label: "Paused",
    emptyTitle: "No paused worklogs",
    emptyCopy: "Paused project or not-started task logs land here until work resumes.",
  },
  {
    state: "blocked",
    label: "Blocked",
    emptyTitle: "No blocked worklogs",
    emptyCopy: "Blocked task logs appear here when a blocker or dependency needs attention.",
  },
  {
    state: "waiting-qa",
    label: "Waiting QA",
    emptyTitle: "No QA worklogs",
    emptyCopy: "Logs for tasks waiting on mentor QA appear here.",
  },
  {
    state: "closed",
    label: "Closed",
    emptyTitle: "No closed worklogs",
    emptyCopy: "Completed task logs land here after work is closed.",
  },
] as const;

export type WorkLogActiveBoardState = (typeof WORKLOG_ACTIVE_BOARD_COLUMNS)[number]["state"];

export interface WorkLogActiveBoardCard {
  blockerLabel: string;
  elapsedLabel: string;
  id: string;
  latestWorkLog: WorkLogRecord;
  needsHelp: boolean;
  recentActivityLabel: string;
  state: WorkLogActiveBoardState;
  studentLabel: string;
  task: TaskRecord | undefined;
  taskLabel: string;
  workLogs: WorkLogRecord[];
}

export interface WorkLogActiveBoard {
  columns: typeof WORKLOG_ACTIVE_BOARD_COLUMNS;
  itemsByState: Record<WorkLogActiveBoardState, WorkLogActiveBoardCard[]>;
  totalCards: number;
}

export function formatWorkLogElapsedHours(hours: number) {
  const formatted = hours.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
  });

  return `${formatted}h elapsed`;
}

export function formatWorkLogActivityDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function normalizeWorkLogBoardSearchText(value: string) {
  return value.trim().toLowerCase();
}
