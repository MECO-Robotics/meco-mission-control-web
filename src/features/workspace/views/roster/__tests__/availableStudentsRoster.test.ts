/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  buildAvailableStudentRoster,
  formatRosterDateKey,
  getPresentRosterMemberIds,
} from "@/features/workspace/views/roster/availableStudentsRoster";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { MemberRecord } from "@/types/recordsOrganization";

const today = new Date();
const todayIso = formatRosterDateKey(today);

const baseStudent = (id: string, name: string, extras: Partial<MemberRecord> = {}): MemberRecord => ({
  activeSeasonIds: ["season-1"],
  elevated: false,
  email: `${id}@mecorobotics.org`,
  id,
  name,
  photoUrl: "",
  role: "student",
  seasonId: "season-1",
  ...extras,
});

const baseTask = (id: string, assigneeId: string, extras: Partial<TaskRecord> = {}): TaskRecord => ({
  actualHours: 0,
  assigneeIds: [assigneeId],
  blockers: [],

  disciplineId: "mechanical",
  documentationLinked: false,
  dueDate: "2026-06-10",
  estimatedHours: 4,
  id,
  linkedManufacturingIds: [],
  linkedPurchaseIds: [],
  mechanismId: null,
  mechanismIds: [],
  mentorId: null,
  ownerId: null,
  partInstanceId: null,
  partInstanceIds: [],
  photoUrl: "",
  planningState: "ready",
  priority: "medium",
  projectId: "project-1",
  requiresDocumentation: false,
  startDate: "2026-06-04",
  status: "in-progress",
  subsystemId: "drive",
  subsystemIds: ["drive"],
  summary: "",
  targetMilestoneId: null,
  title: id,
  workstreamId: null,
  workstreamIds: [],
  ...extras,
});

function createBootstrap(overrides: Partial<BootstrapPayload> = {}): BootstrapPayload {
  const members = [
    baseStudent("available", "Available Student", {
      disciplineId: "mechanical",
      plannedAttendanceNotes: "CAD",
    }),
    baseStudent("blocked", "Blocked Student"),
    baseStudent("busy-task", "Busy Task Student"),
    baseStudent("busy-log", "Busy Log Student"),
    baseStudent("absent", "Absent Student"),
  ];

  return {
    ...EMPTY_BOOTSTRAP,
    attendanceRecords: members
      .filter((member) => member.id !== "absent")
      .map((member) => ({
        date: todayIso,
        id: `attendance-${member.id}`,
        memberId: member.id,
        totalHours: 1,
      })),
    disciplines: [{ code: "design", id: "mechanical", name: "Mechanical" }],
    members,
    projects: [{ description: "", id: "project-1", name: "Robot", projectType: "robot", seasonId: "season-1", status: "active" }],
    subsystems: [
      {
        color: "",
        description: "",
        id: "drive",
        isCore: true,
        iteration: 1,
        mentorIds: [],
        name: "Drive",
        parentSubsystemId: null,
        projectId: "project-1",
        responsibleEngineerId: null,
        risks: [],
      },
    ],
    taskBlockers: [
      {
        blockedTaskId: "blocked-task",
        blockerId: null,
        blockerType: "other",
        createdAt: "2026-06-04T12:00:00Z",
        createdByMemberId: null,
        description: "Needs mentor decision",
        id: "blocker-1",
        resolvedAt: null,
        severity: "medium",
        status: "open",
      },
    ],
    tasks: [
      baseTask("blocked-task", "blocked", { planningState: "blocked", title: "Resolve blocker" }),
      baseTask("busy-task", "busy-task", { title: "Build intake" }),
      baseTask("logged-task", "nobody", { title: "Logged task" }),
    ],
    workLogs: [
      {
        date: todayIso,
        hours: 1,
        id: "worklog-1",
        notes: "Already cutting stock",
        participantIds: ["busy-log"],
        taskId: "logged-task",
      },
    ],
    ...overrides,
  };
}

describe("buildAvailableStudentRoster", () => {
  it("separates present available, blocked/waiting, and busy students", () => {
    const roster = buildAvailableStudentRoster(createBootstrap(), { today });

    expect(roster.presentCount).toBe(4);
    expect(roster.available.map((row) => row.member.id)).toEqual(["available"]);
    expect(roster.blockedWaiting.map((row) => row.member.id)).toEqual(["blocked"]);
    expect(roster.busy.map((row) => row.member.id)).toEqual(["busy-log", "busy-task"]);
  });

  it("exposes discipline, attendance-note, and subsystem hints", () => {
    const roster = buildAvailableStudentRoster(createBootstrap(), { today });

    expect(roster.available[0].hints).toEqual(["Mechanical", "CAD"]);
    expect(roster.blockedWaiting[0].hints).toContain("Drive");
  });

  it("keeps waiting-for-qa students out of the available bucket", () => {
    const bootstrap = createBootstrap({
      tasks: [baseTask("qa-task", "available", { status: "waiting-for-qa" })],
      workLogs: [],
      taskBlockers: [],
    });

    const roster = buildAvailableStudentRoster(bootstrap, { today });

    expect(roster.available.map((row) => row.member.id)).not.toContain("available");
    expect(roster.blockedWaiting.map((row) => row.member.id)).toContain("available");
  });
});

describe("availability across scopes", () => {
  it("keeps assignments when the visible project has no tasks", () => {
    const full = createBootstrap();
    const roster = buildAvailableStudentRoster(full, { today });
    expect(roster.busy.find(row => row.member.id === "busy-task")?.activeTask?.title).toBe("Build intake");
  });
  it("does not manufacture presence when attendance is empty", () => {
    expect(buildAvailableStudentRoster(createBootstrap({ attendanceRecords: [] }), { today }).presentCount).toBe(0);
  });
});

it("records attendance for every role without turning mentors into available students", () => {
  const members = [baseStudent("student", "Student"), baseStudent("mentor", "Mentor", { role: "mentor" }), baseStudent("admin", "Admin", { role: "admin" }), baseStudent("external", "External", { role: "external" })];
  const bootstrap = createBootstrap({ members, tasks: [], workLogs: [], taskBlockers: [],
    attendanceRecords: [...members.map(member => ({ id: member.id, memberId: member.id, date: todayIso, totalHours: 1 })),
      { id: "outside", memberId: "outside", date: todayIso, totalHours: 1 }],
  });
  expect([...getPresentRosterMemberIds(bootstrap, { today })].sort()).toEqual(["admin", "external", "mentor", "student"]);
  expect(buildAvailableStudentRoster(bootstrap, { today }).available.map(row => row.member.id)).toEqual(["student"]);
  expect(getPresentRosterMemberIds({ ...bootstrap, attendanceRecords: (bootstrap.attendanceRecords ?? []).map(record => ({ ...record, totalHours: 0 })) }, { today }).size).toBe(0);
});
