/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { RosterAvailableStudentsView } from "@/features/workspace/views/roster/RosterAvailableStudentsView";
import {
  buildAvailableStudentRoster,
  formatRosterDateKey,
} from "@/features/workspace/views/roster/availableStudentsRoster";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import type { MemberRecord } from "@/types/recordsOrganization";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

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

describe("RosterAvailableStudentsView", () => {
  it("renders empty states when no students are present", () => {
    const html = renderToStaticMarkup(
      React.createElement(RosterAvailableStudentsView, {
        bootstrap: createBootstrap({ attendanceRecords: [] }),
        onCreateTask: jest.fn(),
        onCreateTaskForMember: jest.fn(),
        onOpenTask: jest.fn(),
        selectedProject: null,
      }),
    );

    expect(html).toContain("Available Students");
    expect(html).toContain("Present today");
    expect(html).toContain("No students here.");
    expect(html).toContain("No present students are blocked or waiting.");
  });

  it("uses full availability data so scoped project views do not hide assignments", () => {
    const baseBootstrap = createBootstrap();
    const availabilityBootstrap = createBootstrap({
      attendanceRecords: [
        ...(baseBootstrap.attendanceRecords ?? []),
        {
          date: todayIso,
          id: "attendance-other-season",
          memberId: "other-season",
          totalHours: 1,
        },
      ],
      members: [
        ...baseBootstrap.members,
        baseStudent("other-season", "Other Season Student", {
          activeSeasonIds: ["season-2"],
          seasonId: "season-2",
        }),
      ],
    });
    const scopedBootstrap = {
      ...availabilityBootstrap,
      members: availabilityBootstrap.members.filter((member) => member.seasonId === "season-1"),
      taskBlockers: [],
      tasks: [],
      workLogs: [],
    };
    const html = renderToStaticMarkup(
      React.createElement(RosterAvailableStudentsView, {
        availabilityBootstrap,
        bootstrap: scopedBootstrap,
        onCreateTask: jest.fn(),
        onCreateTaskForMember: jest.fn(),
        onOpenTask: jest.fn(),
        selectedProject: availabilityBootstrap.projects[0],
      }),
    );

    expect(html).toContain("Busy Task Student");
    expect(html).toContain("Already assigned");
    expect(html).toContain("Build intake");
    expect(html).not.toContain('<button class="ghost-button" type="button">Build intake</button>');
    expect(html).not.toContain("Other Season Student");
  });
});
