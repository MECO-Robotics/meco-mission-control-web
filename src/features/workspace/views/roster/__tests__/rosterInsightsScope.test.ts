/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildRosterInsightsFromBootstrap } from "@/features/workspace/views/roster/rosterInsightsFallback";
import {
  areRosterInsightsRowsInScope,
  getScopedRosterMemberIds,
} from "@/features/workspace/views/roster/rosterInsightsScope";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsResponse } from "@/types/rosterInsights";

function createBootstrapFixture(): BootstrapPayload {
  const recentDate = new Date();
  recentDate.setUTCDate(recentDate.getUTCDate() - 1);
  const recentDateKey = recentDate.toISOString().slice(0, 10);

  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      {
        id: "project-season-1",
        seasonId: "season-1",
        name: "Robot 2026",
        projectType: "robot",
        description: "",
        status: "active",
      },
      {
        id: "project-season-2",
        seasonId: "season-2",
        name: "Outreach 2026",
        projectType: "outreach",
        description: "",
        status: "active",
      },
    ],
    members: [
      {
        id: "member-season-1",
        name: "Season One Member",
        email: "one@example.com",
        role: "student",
        elevated: false,
        seasonId: "season-1",
        activeSeasonIds: ["season-1"],
      },
      {
        id: "member-season-2",
        name: "Season Two Member",
        email: "two@example.com",
        role: "student",
        elevated: false,
        seasonId: "season-2",
        activeSeasonIds: ["season-2"],
      },
    ],
    attendanceRecords: [
      {
        id: "attendance-season-1",
        memberId: "member-season-1",
        date: recentDateKey,
        totalHours: 3,
      },
      {
        id: "attendance-season-2",
        memberId: "member-season-2",
        date: recentDateKey,
        totalHours: 4,
      },
    ],
  };
}

describe("roster insights scope helpers", () => {
  it("derives scoped member ids from project/season scope", () => {
    const bootstrap = createBootstrapFixture();
    const scopedIds = getScopedRosterMemberIds(bootstrap, {
      projectId: "project-season-1",
      seasonId: null,
    });

    expect(scopedIds).toEqual(new Set(["member-season-1"]));
  });

  it("flags out-of-scope roster insights rows", () => {
    const response: RosterInsightsResponse = {
      summary: {
        memberCount: 2,
        activeMemberCount: 1,
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
      },
      members: [
        {
          memberId: "member-season-1",
          memberName: "Season One Member",
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
        },
      ],
      attendanceTimeline: [],
      recentAttendance: [
        {
          id: "row-1",
          memberId: "member-season-2",
          memberName: "Season Two Member",
          date: "2026-04-20",
          totalHours: 4,
          activeTaskCount: 0,
          availabilityStatus: "available",
        },
      ],
      generatedAt: "2026-04-21T00:00:00.000Z",
    };

    expect(areRosterInsightsRowsInScope(response, new Set(["member-season-1"]))).toBe(false);
  });

  it("accepts scoped response rows when attendance member ids are represented in members", () => {
    const response: RosterInsightsResponse = {
      summary: {
        memberCount: 1,
        activeMemberCount: 1,
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
      },
      members: [
        {
          memberId: "member-season-2",
          memberName: "Season Two Member",
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
        },
      ],
      attendanceTimeline: [],
      recentAttendance: [
        {
          id: "row-1",
          memberId: "member-season-2",
          memberName: "Season Two Member",
          date: "2026-04-20",
          totalHours: 4,
          activeTaskCount: 0,
          availabilityStatus: "available",
        },
      ],
      generatedAt: "2026-04-21T00:00:00.000Z",
    };

    expect(areRosterInsightsRowsInScope(response, new Set(["member-season-2"]))).toBe(true);
  });

  it("flags internally consistent rows that are outside the requested scope", () => {
    const response: RosterInsightsResponse = {
      summary: {
        memberCount: 1,
        activeMemberCount: 1,
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
      },
      members: [
        {
          memberId: "member-season-2",
          memberName: "Season Two Member",
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
        },
      ],
      attendanceTimeline: [],
      recentAttendance: [
        {
          id: "row-1",
          memberId: "member-season-2",
          memberName: "Season Two Member",
          date: "2026-04-20",
          totalHours: 4,
          activeTaskCount: 0,
          availabilityStatus: "available",
        },
      ],
      generatedAt: "2026-04-21T00:00:00.000Z",
    };

    expect(areRosterInsightsRowsInScope(response, new Set(["member-season-1"]))).toBe(false);
  });

  it("keeps fallback insights scoped to selected project season", () => {
    const bootstrap = createBootstrapFixture();
    const scopedInsights = buildRosterInsightsFromBootstrap(bootstrap, {
      projectId: "project-season-1",
      seasonId: null,
    });

    expect(scopedInsights.summary.memberCount).toBe(1);
    expect(scopedInsights.members.map((member) => member.memberId)).toEqual([
      "member-season-1",
    ]);
    expect(scopedInsights.recentAttendance.every((row) => row.memberId === "member-season-1")).toBe(true);
  });

  it("bases fallback availability on planned weekly attendance", () => {
    const bootstrap = {
      ...createBootstrapFixture(),
      members: createBootstrapFixture().members.map((member) =>
        member.id === "member-season-1"
          ? {
              ...member,
              plannedWeeklyAttendanceHours: 0,
              plannedAttendanceDays: [],
              plannedAttendanceNotes: "",
            }
          : member,
      ),
      tasks: [
        {
          id: "season-task",
          projectId: "project-season-1",
          workstreamId: null,
          workstreamIds: [],
          title: "Season task",
          summary: "",
          subsystemId: "subsystem-1",
          subsystemIds: ["subsystem-1"],
          disciplineId: "design",
          mechanismId: null,
          mechanismIds: [],
          partInstanceId: null,
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
        },
      ],
    } satisfies BootstrapPayload;

    const unavailableInsights = buildRosterInsightsFromBootstrap(bootstrap, {
      projectId: "project-season-1",
      seasonId: null,
    });

    expect(unavailableInsights.members[0].availabilityStatus).toBe("unavailable");
    expect(unavailableInsights.summary.noPlannedAttendanceWithTasksCount).toBe(1);

    const scheduledInsights = buildRosterInsightsFromBootstrap(
      {
        ...bootstrap,
        members: bootstrap.members.map((member) =>
          member.id === "member-season-1"
            ? {
                ...member,
                plannedWeeklyAttendanceHours: 6,
                plannedAttendanceDays: ["monday", "wednesday"],
                plannedAttendanceNotes: "Expected at build nights.",
              }
            : member,
        ),
      },
      {
        projectId: "project-season-1",
        seasonId: null,
      },
    );

    expect(scheduledInsights.members[0].availabilityStatus).toBe("available");
    expect(scheduledInsights.members[0].plannedWeeklyAttendanceHours).toBe(6);
    expect(scheduledInsights.members[0].plannedAttendanceDays).toEqual(["monday", "wednesday"]);
    expect(scheduledInsights.summary.plannedWeeklyAttendanceHours).toBe(6);
  });
});
