import type { BootstrapPayload } from "@/types/bootstrap";
import type {
  RosterAvailabilityStatus,
  RosterInsightsMember,
  RosterInsightsResponse,
  RosterInsightsTaskPreview,
} from "@/types/rosterInsights";
import {
  getScopedRosterSeasonId,
  isMemberInSeason,
} from "./rosterInsightsScope";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface RosterInsightsFallbackScope {
  projectId?: string | null;
  seasonId?: string | null;
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function availabilityStatusFromMetrics(metrics: {
  activeTaskCount: number;
  attendanceHoursLast14Days: number;
  overdueTaskCount: number;
  blockedTaskCount: number;
  remainingOpenHours: number;
}): RosterAvailabilityStatus {
  if (metrics.activeTaskCount > 0 && metrics.attendanceHoursLast14Days <= 0.25) {
    return "unavailable";
  }
  if (
    metrics.overdueTaskCount >= 3 ||
    metrics.remainingOpenHours >= 28 ||
    (metrics.blockedTaskCount >= 3 && metrics.activeTaskCount >= 4)
  ) {
    return "overloaded";
  }
  if (
    metrics.overdueTaskCount >= 1 ||
    metrics.blockedTaskCount >= 1 ||
    (metrics.activeTaskCount >= 3 && metrics.attendanceHoursLast14Days < 4)
  ) {
    return "at-risk";
  }

  return "available";
}

function sortTaskPreviews(left: RosterInsightsTaskPreview, right: RosterInsightsTaskPreview) {
  const leftDue = parseDateValue(left.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightDue = parseDateValue(right.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  const priorityOrder = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  } as const;
  const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return left.title.localeCompare(right.title);
}

export function buildRosterInsightsFromBootstrap(
  bootstrap: BootstrapPayload,
  scope: RosterInsightsFallbackScope = {},
): RosterInsightsResponse {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day7Start = new Date(today.getTime() - 6 * MS_PER_DAY);
  const day14Start = new Date(today.getTime() - 13 * MS_PER_DAY);
  const day30Start = new Date(today.getTime() - 29 * MS_PER_DAY);
  const dueSoonEnd = new Date(today.getTime() + 7 * MS_PER_DAY);

  const scopedSeasonId = getScopedRosterSeasonId(bootstrap, {
    projectId: scope.projectId ?? null,
    seasonId: scope.seasonId ?? null,
  });
  const attendanceRecords = bootstrap.attendanceRecords ?? [];
  const projectsById = new Map(bootstrap.projects.map((project) => [project.id, project] as const));
  const scopedMembers = bootstrap.members.filter((member) => isMemberInSeason(member, scopedSeasonId));
  const scopedMemberIds = new Set(scopedMembers.map((member) => member.id));
  const scopedAttendanceRecords = attendanceRecords.filter((record) => scopedMemberIds.has(record.memberId));
  const openTaskBlockerIds = new Set(
    (bootstrap.taskBlockers ?? [])
      .filter((blocker) => blocker.status === "open")
      .map((blocker) => blocker.blockedTaskId),
  );
  const openTasks = bootstrap.tasks.filter((task) => {
    if (task.status === "complete") {
      return false;
    }

    if (scope.projectId) {
      return task.projectId === scope.projectId;
    }

    if (scopedSeasonId) {
      return projectsById.get(task.projectId)?.seasonId === scopedSeasonId;
    }

    return true;
  });

  const members = scopedMembers
    .map<RosterInsightsMember>((member) => {
      const assignedTasks = openTasks.filter(
        (task) => task.ownerId === member.id || task.assigneeIds.includes(member.id),
      );
      const topTasks = assignedTasks
        .map<RosterInsightsTaskPreview>((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          projectId: task.projectId,
          projectName: projectsById.get(task.projectId)?.name ?? "Unknown project",
          status: task.status,
        }))
        .sort(sortTaskPreviews)
        .slice(0, 3);

      const overdueTaskCount = assignedTasks.filter((task) => {
        const dueDate = parseDateValue(task.dueDate);
        return dueDate !== null && dueDate.getTime() < today.getTime();
      }).length;
      const dueSoonTaskCount = assignedTasks.filter((task) => {
        const dueDate = parseDateValue(task.dueDate);
        if (!dueDate) {
          return false;
        }
        const time = dueDate.getTime();
        return time >= today.getTime() && time <= dueSoonEnd.getTime();
      }).length;

      const blockedTaskCount = assignedTasks.filter(
        (task) => task.isBlocked || openTaskBlockerIds.has(task.id),
      ).length;
      const waitingForQaTaskCount = assignedTasks.filter(
        (task) => task.status === "waiting-for-qa",
      ).length;
      const estimatedOpenHours = assignedTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
      const remainingOpenHours = assignedTasks.reduce(
        (sum, task) => sum + Math.max(0, task.estimatedHours - task.actualHours),
        0,
      );

      const memberAttendanceRecords = scopedAttendanceRecords.filter((record) => record.memberId === member.id);
      const attendanceHoursLast7Days = memberAttendanceRecords.reduce((sum, record) => {
        const attendanceDate = parseDateValue(record.date);
        return !attendanceDate || attendanceDate < day7Start ? sum : sum + record.totalHours;
      }, 0);
      const attendanceHoursLast14Days = memberAttendanceRecords.reduce((sum, record) => {
        const attendanceDate = parseDateValue(record.date);
        return !attendanceDate || attendanceDate < day14Start ? sum : sum + record.totalHours;
      }, 0);
      const attendanceHoursLast30Days = memberAttendanceRecords.reduce((sum, record) => {
        const attendanceDate = parseDateValue(record.date);
        return !attendanceDate || attendanceDate < day30Start ? sum : sum + record.totalHours;
      }, 0);
      const attendanceSessionsLast30Days = memberAttendanceRecords.filter((record) => {
        const attendanceDate = parseDateValue(record.date);
        return Boolean(attendanceDate && attendanceDate >= day30Start);
      }).length;

      return {
        memberId: member.id,
        memberName: member.name,
        role: member.role,
        disciplineId: member.disciplineId ?? null,
        activeTaskCount: assignedTasks.length,
        blockedTaskCount,
        waitingForQaTaskCount,
        overdueTaskCount,
        dueSoonTaskCount,
        estimatedOpenHours: Number(estimatedOpenHours.toFixed(1)),
        remainingOpenHours: Number(remainingOpenHours.toFixed(1)),
        attendanceHoursLast7Days: Number(attendanceHoursLast7Days.toFixed(1)),
        attendanceHoursLast14Days: Number(attendanceHoursLast14Days.toFixed(1)),
        attendanceHoursLast30Days: Number(attendanceHoursLast30Days.toFixed(1)),
        attendanceSessionsLast30Days,
        availabilityStatus: availabilityStatusFromMetrics({
          activeTaskCount: assignedTasks.length,
          attendanceHoursLast14Days,
          overdueTaskCount,
          blockedTaskCount,
          remainingOpenHours,
        }),
        topTasks,
      };
    })
    .sort((left, right) => {
      const statusOrder: Record<RosterAvailabilityStatus, number> = {
        unavailable: 0,
        overloaded: 1,
        "at-risk": 2,
        available: 3,
      };
      const statusDelta = statusOrder[left.availabilityStatus] - statusOrder[right.availabilityStatus];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return right.activeTaskCount - left.activeTaskCount;
    });

  const attendanceTimelineByDate = new Map<string, { totalHours: number; memberIds: Set<string> }>();
  scopedAttendanceRecords.forEach((record) => {
    const attendanceDate = parseDateValue(record.date);
    if (!attendanceDate || attendanceDate < day30Start) {
      return;
    }

    const key = attendanceDate.toISOString().slice(0, 10);
    const bucket = attendanceTimelineByDate.get(key) ?? { totalHours: 0, memberIds: new Set<string>() };
    bucket.totalHours += record.totalHours;
    bucket.memberIds.add(record.memberId);
    attendanceTimelineByDate.set(key, bucket);
  });

  const attendanceTimeline = [...attendanceTimelineByDate.entries()]
    .map(([date, metric]) => ({
      date,
      totalHours: Number(metric.totalHours.toFixed(1)),
      memberCount: metric.memberIds.size,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  const membersById = new Map(members.map((member) => [member.memberId, member] as const));
  const recentAttendance = [...scopedAttendanceRecords]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 30)
    .map((record) => {
      const member = membersById.get(record.memberId);
      return {
        id: record.id,
        memberId: record.memberId,
        memberName: member?.memberName ?? "Unknown member",
        date: record.date,
        totalHours: record.totalHours,
        activeTaskCount: member?.activeTaskCount ?? 0,
        availabilityStatus: member?.availabilityStatus ?? "available",
      };
    });

  return {
    summary: {
      memberCount: members.length,
      activeMemberCount: members.filter((member) => member.activeTaskCount > 0).length,
      openTaskCount: openTasks.length,
      overdueTaskCount: members.reduce((sum, member) => sum + member.overdueTaskCount, 0),
      blockedTaskCount: members.reduce((sum, member) => sum + member.blockedTaskCount, 0),
      waitingForQaTaskCount: members.reduce((sum, member) => sum + member.waitingForQaTaskCount, 0),
      unassignedTaskCount: openTasks.filter(
        (task) => task.ownerId === null && task.assigneeIds.length === 0,
      ).length,
      overloadedMemberCount: members.filter((member) => member.availabilityStatus === "overloaded").length,
      unavailableMemberCount: members.filter((member) => member.availabilityStatus === "unavailable").length,
      attendanceHoursLast14Days: Number(
        members.reduce((sum, member) => sum + member.attendanceHoursLast14Days, 0).toFixed(1),
      ),
      attendanceHoursLast30Days: Number(
        members.reduce((sum, member) => sum + member.attendanceHoursLast30Days, 0).toFixed(1),
      ),
      noRecentAttendanceWithTasksCount: members.filter(
        (member) => member.activeTaskCount > 0 && member.attendanceHoursLast14Days <= 0.25,
      ).length,
    },
    members,
    attendanceTimeline,
    recentAttendance,
    generatedAt: now.toISOString(),
  };
}
