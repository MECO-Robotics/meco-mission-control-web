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
        attendanceHoursLast14Days: 0,
        attendanceHoursLast30Days: 0,
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
        attendanceHoursLast14Days: 0,
        attendanceHoursLast30Days: 0,
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
        attendanceHoursLast14Days: 0,
        attendanceHoursLast30Days: 0,
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
});
