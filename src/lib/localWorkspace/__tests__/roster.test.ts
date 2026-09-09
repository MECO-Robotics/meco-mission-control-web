import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { localRosterInsights } from "../roster";

it("uses current roster names and season membership for attendance and workload summaries", () => {
  const snapshot = createBootstrap();
  const first = snapshot.members[0];
  first.name = "Updated demo name";
  first.seasonId = "local-season";
  first.activeSeasonIds = ["local-season"];
  first.plannedWeeklyAttendanceHours = 6;
  snapshot.members.slice(1).forEach((member) => { member.seasonId = "other"; member.activeSeasonIds = ["other"]; });
  const today = new Date().toISOString().slice(0, 10);
  snapshot.attendanceRecords = [
    { id: "current", memberId: first.id, date: today, totalHours: 2 },
    { id: "other", memberId: snapshot.members[1].id, date: today, totalHours: 4 },
    { id: "removed", memberId: "removed-member", date: today, totalHours: 8 },
  ];
  const insights = localRosterInsights(snapshot, new URLSearchParams({ seasonId: "local-season" }));
  expect(insights.members.map((member) => member.memberName)).toEqual(["Updated demo name"]);
  expect(insights.recentAttendance).toMatchObject([{ memberId: first.id, memberName: "Updated demo name" }]);
  expect(insights.summary.attendanceHoursLast30Days).toBe(2);
  expect(insights.attendanceTimeline[0]).toMatchObject({ totalHours: 2, memberCount: 1 });
  expect(insights.members[0].availabilityStatus).toBe("available");
});
