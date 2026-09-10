import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord, WorkLogRecord } from "@/types/recordsExecution";
import type { MemberRecord } from "@/types/recordsOrganization";

export type AvailableStudentRosterState = "available" | "blocked-waiting" | "busy";

export interface AvailableStudentRosterRow {
  activeTask: TaskRecord | null;
  hints: string[];
  member: MemberRecord;
  state: AvailableStudentRosterState;
  stateLabel: string;
  todayWorkLogs: WorkLogRecord[];
}

export interface AvailableStudentRoster {
  available: AvailableStudentRosterRow[];
  blockedWaiting: AvailableStudentRosterRow[];
  busy: AvailableStudentRosterRow[];
  presentCount: number;
}

export function formatRosterDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenTask(task: TaskRecord) {
  return task.status !== "complete";
}

function isBlockedOrWaitingTask(task: TaskRecord, openBlockerTaskIds: Set<string>) {
  return (
    task.isBlocked ||
    task.isWaitingOnDependency ||
    task.planningState === "blocked" ||
    task.planningState === "waiting-on-dependency" ||
    task.status === "waiting-for-qa" ||
    openBlockerTaskIds.has(task.id)
  );
}

function getAssignedOpenTasks(memberId: string, tasks: TaskRecord[]) {
  return tasks.filter(
    (task) => isOpenTask(task) && (task.ownerId === memberId || task.assigneeIds.includes(memberId)),
  );
}

function getTodayWorkLogs(memberId: string, workLogs: WorkLogRecord[], todayKey: string) {
  return workLogs.filter(
    (workLog) => workLog.date === todayKey && workLog.participantIds.includes(memberId),
  );
}

function buildHints({
  bootstrap,
  member,
  task,
}: {
  bootstrap: BootstrapPayload;
  member: MemberRecord;
  task: TaskRecord | null;
}) {
  const hints = new Set<string>();
  const discipline = bootstrap.disciplines.find((candidate) => candidate.id === member.disciplineId);
  if (discipline) {
    hints.add(discipline.name);
  }

  (member.plannedAttendanceDays ?? []).forEach((day) => hints.add(day));
  if (member.plannedAttendanceNotes) {
    hints.add(member.plannedAttendanceNotes);
  }

  const taskSubsystemIds = task ? [task.subsystemId, ...task.subsystemIds].filter(Boolean) : [];
  taskSubsystemIds.forEach((subsystemId) => {
    const subsystem = bootstrap.subsystems.find((candidate) => candidate.id === subsystemId);
    if (subsystem) {
      hints.add(subsystem.name);
    }
  });

  return [...hints];
}

function pickActiveTask(tasks: TaskRecord[], openBlockerTaskIds: Set<string>) {
  return [...tasks].sort((left, right) => {
    const blockedDelta =
      Number(isBlockedOrWaitingTask(right, openBlockerTaskIds)) -
      Number(isBlockedOrWaitingTask(left, openBlockerTaskIds));
    if (blockedDelta !== 0) {
      return blockedDelta;
    }

    return left.dueDate.localeCompare(right.dueDate) || left.title.localeCompare(right.title);
  })[0] ?? null;
}

function classifyStudent(args: {
  activeTask: TaskRecord | null;
  openBlockerTaskIds: Set<string>;
  taskById: Map<string, TaskRecord>;
  todayWorkLogs: WorkLogRecord[];
}): { label: string; state: AvailableStudentRosterState } {
  const worklogTasks = args.todayWorkLogs
    .map((workLog) => args.taskById.get(workLog.taskId))
    .filter((task): task is TaskRecord => Boolean(task));
  const waitingTask = [args.activeTask, ...worklogTasks].find(
    (task) => task && isBlockedOrWaitingTask(task, args.openBlockerTaskIds),
  );
  if (waitingTask) {
    return { label: "Blocked / waiting", state: "blocked-waiting" };
  }

  if (args.activeTask || args.todayWorkLogs.length > 0) {
    return { label: "Already assigned", state: "busy" };
  }

  return { label: "Available now", state: "available" };
}

export function getPresentRosterMemberIds(
  bootstrap: BootstrapPayload,
  options: { today?: Date } = {},
) {
  const todayKey = formatRosterDateKey(options.today ?? new Date());
  const scopedIds = new Set(bootstrap.members.map((member) => member.id));
  return new Set((bootstrap.attendanceRecords ?? [])
    .filter((record) => record.date === todayKey && record.totalHours > 0 && scopedIds.has(record.memberId))
    .map((record) => record.memberId));
}

export function buildAvailableStudentRoster(
  bootstrap: BootstrapPayload,
  options: { today?: Date } = {},
): AvailableStudentRoster {
  const todayKey = formatRosterDateKey(options.today ?? new Date());
  const presentMemberIds = getPresentRosterMemberIds(bootstrap, options);
  const students = bootstrap.members.filter(
    (member) => (member.role === "student" || member.role === "lead") && presentMemberIds.has(member.id),
  );
  const openBlockerTaskIds = new Set(
    (bootstrap.taskBlockers ?? [])
      .filter((blocker) => blocker.status === "open")
      .map((blocker) => blocker.blockedTaskId),
  );
  const taskById = new Map(bootstrap.tasks.map((task) => [task.id, task] as const));
  const rows = students.map<AvailableStudentRosterRow>((member) => {
    const activeTask = pickActiveTask(getAssignedOpenTasks(member.id, bootstrap.tasks), openBlockerTaskIds);
    const todayWorkLogs = getTodayWorkLogs(member.id, bootstrap.workLogs, todayKey);
    const classification = classifyStudent({ activeTask, openBlockerTaskIds, taskById, todayWorkLogs });

    return {
      activeTask,
      hints: buildHints({ bootstrap, member, task: activeTask }),
      member,
      state: classification.state,
      stateLabel: classification.label,
      todayWorkLogs,
    };
  });
  const sortRows = (items: AvailableStudentRosterRow[]) =>
    [...items].sort((left, right) => left.member.name.localeCompare(right.member.name));

  return {
    available: sortRows(rows.filter((row) => row.state === "available")),
    blockedWaiting: sortRows(rows.filter((row) => row.state === "blocked-waiting")),
    busy: sortRows(rows.filter((row) => row.state === "busy")),
    presentCount: rows.length,
  };
}
