import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerRecord, TaskRecord, WorkLogRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { filterSelectionIncludes } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { MembersById } from "@/features/workspace/shared/model/workspaceTypes";
import {
  getTaskOpenBlockersForTask,
  getTaskWaitingOnDependencies,
} from "@/features/workspace/shared/task/taskPlanning";
import {
  WORKLOG_ACTIVE_BOARD_COLUMNS,
  formatWorkLogActivityDate,
  formatWorkLogElapsedHours,
  normalizeWorkLogBoardSearchText,
  type WorkLogActiveBoard,
  type WorkLogActiveBoardCard,
  type WorkLogActiveBoardState,
} from "./workLogsActiveBoardModel";

export { WORKLOG_ACTIVE_BOARD_COLUMNS };
export type { WorkLogActiveBoard, WorkLogActiveBoardCard, WorkLogActiveBoardState };

interface GroupActiveWorklogCardsArgs {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  search: string;
}

function buildEmptyItemsByState(): Record<WorkLogActiveBoardState, WorkLogActiveBoardCard[]> {
  return {
    active: [],
    paused: [],
    blocked: [],
    "waiting-qa": [],
    closed: [],
  };
}

function latestWorkLogForTask(workLogs: WorkLogRecord[]) {
  return [...workLogs].sort(
    (left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id),
  )[0];
}

function hasNeedHelpSignal(workLogs: WorkLogRecord[]) {
  return workLogs.some((workLog) =>
    /\b(needs?|needed)\s+help\b|\bhelp\s+needed\b|\brequest(?:ing|ed)?\s+help\b/i.test(
      workLog.notes,
    ),
  );
}

function resolveStudentLabel(workLogs: WorkLogRecord[], membersById: MembersById) {
  const names = Array.from(
    new Set(
      workLogs.flatMap((workLog) =>
        workLog.participantIds.map((participantId) => membersById[participantId]?.name ?? ""),
      ),
    ),
  ).filter(Boolean);

  if (names.length === 0) {
    return "No student";
  }

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function resolveBoardState({
  bootstrap,
  task,
}: {
  bootstrap: BootstrapPayload;
  task: TaskRecord | undefined;
}): WorkLogActiveBoardState {
  if (!task) {
    return "paused";
  }

  if (task.status === "complete") {
    return "closed";
  }

  if (
    task.isBlocked ||
    task.isWaitingOnDependency ||
    task.planningState === "blocked" ||
    task.planningState === "waiting-on-dependency" ||
    getTaskOpenBlockersForTask(task.id, bootstrap).length > 0 ||
    getTaskWaitingOnDependencies(task.id, bootstrap).length > 0
  ) {
    return "blocked";
  }

  if (task.status === "waiting-for-qa") {
    return "waiting-qa";
  }

  const project = bootstrap.projects.find((candidate) => candidate.id === task.projectId);
  if (project?.status === "paused" || task.status === "not-started") {
    return "paused";
  }

  return "active";
}

function resolveBlockerLabel({
  bootstrap,
  state,
  task,
}: {
  bootstrap: BootstrapPayload;
  state: WorkLogActiveBoardState;
  task: TaskRecord | undefined;
}) {
  if (!task || state !== "blocked") {
    return "No blocker";
  }

  const blocker: TaskBlockerRecord | undefined = getTaskOpenBlockersForTask(task.id, bootstrap)[0];
  if (blocker?.description) {
    return `Blocked: ${blocker.description}`;
  }

  return "Blocked: Waiting on dependency";
}

function cardMatchesSearch(card: WorkLogActiveBoardCard, query: string) {
  if (!query) {
    return true;
  }

  return [
    card.studentLabel,
    card.taskLabel,
    card.elapsedLabel,
    card.recentActivityLabel,
    card.blockerLabel,
    card.state,
    ...card.workLogs.map((workLog) => workLog.notes),
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function buildCard({
  bootstrap,
  membersById,
  task,
  workLogs,
}: {
  bootstrap: BootstrapPayload;
  membersById: MembersById;
  task: TaskRecord | undefined;
  workLogs: WorkLogRecord[];
}): WorkLogActiveBoardCard {
  const latestWorkLog = latestWorkLogForTask(workLogs);
  const totalHours = workLogs.reduce((sum, workLog) => sum + Math.max(0, workLog.hours), 0);
  const state = resolveBoardState({ bootstrap, task });
  const recentNotes = latestWorkLog.notes.trim();

  return {
    blockerLabel: resolveBlockerLabel({ bootstrap, state, task }),
    elapsedLabel: formatWorkLogElapsedHours(totalHours),
    id: task?.id ?? `missing-task:${latestWorkLog.taskId}`,
    latestWorkLog,
    needsHelp: hasNeedHelpSignal(workLogs),
    recentActivityLabel: `Recent: ${formatWorkLogActivityDate(latestWorkLog.date)}${
      recentNotes ? ` - ${recentNotes}` : ""
    }`,
    state,
    studentLabel: resolveStudentLabel(workLogs, membersById),
    task,
    taskLabel: task?.title ?? "Missing task",
    workLogs,
  };
}

export function groupActiveWorklogCards({
  activePersonFilter,
  bootstrap,
  membersById,
  search,
}: GroupActiveWorklogCardsArgs): WorkLogActiveBoard {
  const query = normalizeWorkLogBoardSearchText(search);
  const taskById = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const));
  const workLogsByTaskId = new Map<string, WorkLogRecord[]>();

  bootstrap.workLogs.forEach((workLog) => {
    if (
      activePersonFilter.length > 0 &&
      !workLog.participantIds.some((participantId) =>
        filterSelectionIncludes(activePersonFilter, participantId),
      )
    ) {
      return;
    }

    const group = workLogsByTaskId.get(workLog.taskId) ?? [];
    group.push(workLog);
    workLogsByTaskId.set(workLog.taskId, group);
  });

  const itemsByState = buildEmptyItemsByState();
  workLogsByTaskId.forEach((workLogs, taskId) => {
    const card = buildCard({
      bootstrap,
      membersById,
      task: taskById[taskId],
      workLogs,
    });

    if (cardMatchesSearch(card, query)) {
      itemsByState[card.state].push(card);
    }
  });

  WORKLOG_ACTIVE_BOARD_COLUMNS.forEach((column) => {
    itemsByState[column.state].sort(
      (left, right) =>
        right.latestWorkLog.date.localeCompare(left.latestWorkLog.date) ||
        left.taskLabel.localeCompare(right.taskLabel),
    );
  });

  return {
    columns: WORKLOG_ACTIVE_BOARD_COLUMNS,
    itemsByState,
    totalCards: Object.values(itemsByState).reduce((sum, cards) => sum + cards.length, 0),
  };
}
