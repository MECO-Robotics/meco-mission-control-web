/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildRosterInsightsFromBootstrap } from "@/features/workspace/views/roster/rosterInsightsFallback";
import {
  areRosterInsightsRowsInScope,
  getScopedRosterMemberIds,
} from "@/features/workspace/views/roster/rosterInsightsScope";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsResponse } from "@/types/rosterInsights";

type InsightMember = RosterInsightsResponse["members"][number];
type AttendanceRow = RosterInsightsResponse["recentAttendance"][number];

const emptySummary: RosterInsightsResponse["summary"] = {
  memberCount: 0,
  activeMemberCount: 0,
  openTaskCount: 0,
  overdueTaskCount: 0,
  blockedTaskCount: 0,
  waitingForQaTaskCount: 0,
  unassignedTaskCount: 0,
  overloadedMemberCount: 0,
  unavailableMemberCount: 0,
  plannedWeeklyAttendanceHours: 0,
  attendanceHoursLast14Days: 0,
  attendanceHoursLast30Days: 0,
  noPlannedAttendanceWithTasksCount: 0,
  noRecentAttendanceWithTasksCount: 0,
};

function makeInsightMember(memberId: string, memberName: string): InsightMember {
  return {
    memberId,
    memberName,
    role: "student",
    disciplineId: null,
    activeTaskCount: 0,
    blockedTaskCount: 0,
    waitingForQaTaskCount: 0,
    overdueTaskCount: 0,
    dueSoonTaskCount: 0,
    estimatedOpenHours: 0,
    remainingOpenHours: 0,
    attendanceHoursLast7Days: 0,
    attendanceHoursLast14Days: 0,
    attendanceHoursLast30Days: 0,
    attendanceSessionsLast30Days: 0,
    plannedWeeklyAttendanceHours: 0,
    plannedAttendanceDays: [],
    plannedAttendanceNotes: "",
    availabilityStatus: "available",
    topTasks: [],
  };
}

function makeAttendance(memberId: string, memberName: string): AttendanceRow {
  return {
    id: `attendance-${memberId}`,
    memberId,
    memberName,
    date: "2026-04-20",
    totalHours: 4,
    activeTaskCount: 0,
    availabilityStatus: "available",
  };
}

function makeResponse(members: InsightMember[], recentAttendance: AttendanceRow[]): RosterInsightsResponse {
  return {
    summary: { ...emptySummary, memberCount: members.length, activeMemberCount: members.length },
    members,
    attendanceTimeline: [],
    recentAttendance,
    generatedAt: "2026-04-21T00:00:00.000Z",
  };
}

function createBootstrapFixture(): BootstrapPayload {
  const recentDate = new Date();
  recentDate.setUTCDate(recentDate.getUTCDate() - 1);
  const recentDateKey = recentDate.toISOString().slice(0, 10);

  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      { id: "project-season-1", seasonId: "season-1", name: "Robot 2026", projectType: "robot", description: "", status: "active" },
      { id: "project-season-2", seasonId: "season-2", name: "Outreach 2026", projectType: "outreach", description: "", status: "active" },
    ],
    members: [
      { id: "member-season-1", name: "Season One Member", email: "one@example.com", role: "student", elevated: false, seasonId: "season-1", activeSeasonIds: ["season-1"] },
      { id: "member-season-2", name: "Season Two Member", email: "two@example.com", role: "student", elevated: false, seasonId: "season-2", activeSeasonIds: ["season-2"] },
    ],
    attendanceRecords: [
      { id: "attendance-season-1", memberId: "member-season-1", date: recentDateKey, totalHours: 3 },
      { id: "attendance-season-2", memberId: "member-season-2", date: recentDateKey, totalHours: 4 },
    ],
  };
}

describe("roster insights scope helpers", () => {
  const seasonOne = makeInsightMember("member-season-1", "Season One Member");
  const seasonTwo = makeInsightMember("member-season-2", "Season Two Member");

  it("derives member ids from selected project season", () => {
    expect(getScopedRosterMemberIds(createBootstrapFixture(), {
      projectId: "project-season-1",
      seasonId: null,
    })).toEqual(new Set(["member-season-1"]));
  });

  it("rejects attendance outside the roster response or requested season", () => {
    expect(areRosterInsightsRowsInScope(
      makeResponse([seasonOne], [makeAttendance(seasonTwo.memberId, seasonTwo.memberName)]),
      new Set([seasonOne.memberId]),
    )).toBe(false);
    expect(areRosterInsightsRowsInScope(
      makeResponse([seasonTwo], [makeAttendance(seasonTwo.memberId, seasonTwo.memberName)]),
      new Set([seasonOne.memberId]),
    )).toBe(false);
  });

  it("accepts attendance for a known member inside scope", () => {
    expect(areRosterInsightsRowsInScope(
      makeResponse([seasonTwo], [makeAttendance(seasonTwo.memberId, seasonTwo.memberName)]),
      new Set([seasonTwo.memberId]),
    )).toBe(true);
  });

  it("rejects fallback attendance rows labelled as unknown members", () => {
    expect(areRosterInsightsRowsInScope(
      makeResponse([seasonOne], [makeAttendance(seasonOne.memberId, "Unknown Member")]),
      new Set([seasonOne.memberId]),
    )).toBe(false);
  });

  it("keeps fallback insights scoped to the selected project season", () => {
    const scoped = buildRosterInsightsFromBootstrap(createBootstrapFixture(), {
      projectId: "project-season-1",
      seasonId: null,
    });

    expect(scoped.summary.memberCount).toBe(1);
    expect(scoped.members.map((member) => member.memberId)).toEqual(["member-season-1"]);
    expect(scoped.recentAttendance.every((row) => row.memberId === "member-season-1")).toBe(true);
  });

  it("bases fallback availability on planned weekly attendance", () => {
    const bootstrap = createBootstrapFixture();
    const task: BootstrapPayload["tasks"][number] = {
      artifactIds: [],
      id: "season-task",
      projectId: "project-season-1",
      workstreamIds: [],
      title: "Season task",
      summary: "",
      subsystemIds: ["subsystem-1"],
      disciplineId: "design",
      mechanismIds: [],
      partInstanceIds: [],
      targetMilestoneId: null,
      ownerId: "member-season-1",
      assigneeIds: [],
      mentorId: null,
      startDate: "2026-05-01",
      dueDate: "2099-05-08",
      priority: "medium",
      status: "in-progress",
      planningState: "ready",
      blockers: [],
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      estimatedHours: 3,
      actualHours: 0,
      requiresDocumentation: false,
      documentationLinked: false,
    };
    const noSchedule = buildRosterInsightsFromBootstrap({
      ...bootstrap,
      members: bootstrap.members.map((member) => member.id === "member-season-1"
        ? { ...member, plannedWeeklyAttendanceHours: 0, plannedAttendanceDays: [], plannedAttendanceNotes: "" }
        : member),
      tasks: [task],
    }, { projectId: "project-season-1", seasonId: null });
    const scheduled = buildRosterInsightsFromBootstrap({
      ...bootstrap,
      members: bootstrap.members.map((member) => member.id === "member-season-1"
        ? { ...member, plannedWeeklyAttendanceHours: 6, plannedAttendanceDays: ["monday", "wednesday"], plannedAttendanceNotes: "Expected at build nights." }
        : member),
      tasks: [task],
    }, { projectId: "project-season-1", seasonId: null });

    expect(noSchedule.members[0].availabilityStatus).toBe("unavailable");
    expect(noSchedule.summary.noPlannedAttendanceWithTasksCount).toBe(1);
    expect(scheduled.members[0].availabilityStatus).toBe("available");
    expect(scheduled.members[0].plannedWeeklyAttendanceHours).toBe(6);
    expect(scheduled.members[0].plannedAttendanceDays).toEqual(["monday", "wednesday"]);
    expect(scheduled.summary.plannedWeeklyAttendanceHours).toBe(6);
  });
});
