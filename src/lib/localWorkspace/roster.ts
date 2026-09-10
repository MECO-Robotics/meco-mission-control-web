import { isMemberActiveInSeason } from "@/lib/appUtils/common";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsMember, RosterInsightsResponse } from "@/types/rosterInsights";

export function localRosterInsights(snapshot: BootstrapPayload, query: URLSearchParams): RosterInsightsResponse {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const age = (date: string) => (Date.parse(today) - Date.parse(date)) / 86_400_000;
  const projectId = query.get("projectId");
  const seasonId = query.get("seasonId") ?? snapshot.projects.find((project) => project.id === projectId)?.seasonId ?? null;
  const projectIds = new Set(snapshot.projects.filter((project) => (!projectId || project.id === projectId) && (!seasonId || project.seasonId === seasonId)).map((project) => project.id));
  const openTasks = snapshot.tasks.filter((task) => projectIds.has(task.projectId) && task.status !== "complete");
  const scopedMembers = snapshot.members.filter((member) => !seasonId || isMemberActiveInSeason(member, seasonId));
  const memberIds = new Set(scopedMembers.map((member) => member.id));
  const members: RosterInsightsMember[] = scopedMembers.map((member) => {
    const tasks = openTasks.filter((task) => task.ownerId === member.id || task.assigneeIds.includes(member.id));
    const attendance = (snapshot.attendanceRecords ?? []).filter((record) => record.memberId === member.id && age(record.date) >= 0);
    const hours = (days: number) => attendance.filter((record) => age(record.date) < days).reduce((sum, record) => sum + record.totalHours, 0);
    const remainingOpenHours = tasks.reduce((sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours), 0);
    const plannedWeeklyAttendanceHours = member.plannedWeeklyAttendanceHours ?? 0;
    return {
      memberId: member.id, memberName: member.name, role: member.role ?? "student", disciplineId: member.disciplineId ?? null,
      activeTaskCount: tasks.length, blockedTaskCount: tasks.filter((task) => task.isBlocked).length,
      waitingForQaTaskCount: tasks.filter((task) => task.status === "waiting-for-qa").length,
      overdueTaskCount: tasks.filter((task) => task.dueDate && task.dueDate < today).length,
      dueSoonTaskCount: tasks.filter((task) => task.dueDate && age(task.dueDate) <= 0 && age(task.dueDate) >= -7).length,
      estimatedOpenHours: tasks.reduce((sum, task) => sum + task.estimatedHours, 0), remainingOpenHours,
      attendanceHoursLast7Days: hours(7), attendanceHoursLast14Days: hours(14), attendanceHoursLast30Days: hours(30),
      attendanceSessionsLast30Days: attendance.filter((record) => age(record.date) < 30).length,
      plannedWeeklyAttendanceHours, plannedAttendanceDays: member.plannedAttendanceDays ?? [], plannedAttendanceNotes: member.plannedAttendanceNotes ?? "",
      availabilityStatus: plannedWeeklyAttendanceHours === 0 ? "unavailable" : remainingOpenHours > plannedWeeklyAttendanceHours ? "overloaded" : "available",
      topTasks: tasks.slice(0, 5).map((task) => ({ id: task.id, title: task.title, dueDate: task.dueDate, priority: task.priority, projectId: task.projectId, projectName: snapshot.projects.find((project) => project.id === task.projectId)?.name ?? "", status: task.status })),
    };
  });
  const sum = (field: "plannedWeeklyAttendanceHours" | "attendanceHoursLast14Days" | "attendanceHoursLast30Days") => members.reduce((total, member) => total + member[field], 0);
  const byDate = new Map<string, { date: string; totalHours: number; members: Set<string> }>();
  const recentAttendance = (snapshot.attendanceRecords ?? []).filter((record) => memberIds.has(record.memberId) && age(record.date) >= 0 && age(record.date) < 30).map((record) => {
    const bucket = byDate.get(record.date) ?? { date: record.date, totalHours: 0, members: new Set<string>() };
    bucket.totalHours += record.totalHours; bucket.members.add(record.memberId); byDate.set(record.date, bucket);
    const member = members.find((candidate) => candidate.memberId === record.memberId);
    return { ...record, memberName: member?.memberName ?? "Demo member", activeTaskCount: member?.activeTaskCount ?? 0, availabilityStatus: member?.availabilityStatus ?? "unavailable" as const };
  });
  return {
    generatedAt: now.toISOString(), members, recentAttendance,
    attendanceTimeline: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((bucket) => ({ date: bucket.date, totalHours: bucket.totalHours, memberCount: bucket.members.size })),
    summary: {
      memberCount: members.length, activeMemberCount: members.filter((member) => member.activeTaskCount > 0).length,
      openTaskCount: openTasks.length, overdueTaskCount: openTasks.filter((task) => task.dueDate && task.dueDate < today).length,
      blockedTaskCount: openTasks.filter((task) => task.isBlocked).length, waitingForQaTaskCount: openTasks.filter((task) => task.status === "waiting-for-qa").length,
      unassignedTaskCount: openTasks.filter((task) => !task.ownerId && !task.assigneeIds.length).length,
      overloadedMemberCount: members.filter((member) => member.availabilityStatus === "overloaded").length,
      unavailableMemberCount: members.filter((member) => member.availabilityStatus === "unavailable").length,
      plannedWeeklyAttendanceHours: sum("plannedWeeklyAttendanceHours"), attendanceHoursLast14Days: sum("attendanceHoursLast14Days"), attendanceHoursLast30Days: sum("attendanceHoursLast30Days"),
      noPlannedAttendanceWithTasksCount: members.filter((member) => member.activeTaskCount > 0 && !member.plannedWeeklyAttendanceHours).length,
      noRecentAttendanceWithTasksCount: members.filter((member) => member.activeTaskCount > 0 && !member.attendanceHoursLast30Days).length,
    },
  };
}
