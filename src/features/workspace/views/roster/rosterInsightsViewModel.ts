import type {
  RosterAvailabilityStatus,
  RosterInsightsMember,
  RosterRecentAttendanceRecord,
} from "@/types/rosterInsights";

export type RosterMemberSortMode =
  | "availability"
  | "load-desc"
  | "overdue-desc"
  | "attendance-desc"
  | "name";

const availabilityOrder: Record<RosterAvailabilityStatus, number> = {
  unavailable: 0,
  overloaded: 1,
  "at-risk": 2,
  available: 3,
};

export function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function formatAvailabilityLabel(status: RosterAvailabilityStatus) {
  if (status === "at-risk") {
    return "At Risk";
  }

  return status[0].toUpperCase() + status.slice(1);
}

export function filterAndSortRosterMembers(args: {
  availabilityFilter: RosterAvailabilityStatus | "all";
  members: RosterInsightsMember[];
  searchText: string;
  sortMode: RosterMemberSortMode;
}) {
  const search = args.searchText.trim().toLowerCase();

  const filtered = args.members.filter((member) => {
    if (args.availabilityFilter !== "all" && member.availabilityStatus !== args.availabilityFilter) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      member.memberName.toLowerCase().includes(search) ||
      member.role.toLowerCase().includes(search) ||
      member.topTasks.some((task) => task.title.toLowerCase().includes(search))
    );
  });

  return [...filtered].sort((left, right) => {
    if (args.sortMode === "name") {
      return left.memberName.localeCompare(right.memberName);
    }

    if (args.sortMode === "availability") {
      const statusDelta = availabilityOrder[left.availabilityStatus] - availabilityOrder[right.availabilityStatus];
      if (statusDelta !== 0) {
        return statusDelta;
      }
    }

    if (args.sortMode === "overdue-desc") {
      if (left.overdueTaskCount !== right.overdueTaskCount) {
        return right.overdueTaskCount - left.overdueTaskCount;
      }
      if (left.blockedTaskCount !== right.blockedTaskCount) {
        return right.blockedTaskCount - left.blockedTaskCount;
      }
    }

    if (args.sortMode === "attendance-desc") {
      if (left.attendanceHoursLast14Days !== right.attendanceHoursLast14Days) {
        return right.attendanceHoursLast14Days - left.attendanceHoursLast14Days;
      }
    }

    if (left.remainingOpenHours !== right.remainingOpenHours) {
      return right.remainingOpenHours - left.remainingOpenHours;
    }

    if (left.activeTaskCount !== right.activeTaskCount) {
      return right.activeTaskCount - left.activeTaskCount;
    }

    return left.memberName.localeCompare(right.memberName);
  });
}

export function filterRecentAttendance(args: {
  items: RosterRecentAttendanceRecord[];
  searchText: string;
}) {
  const search = args.searchText.trim().toLowerCase();
  if (!search) {
    return args.items;
  }

  return args.items.filter((entry) => {
    return (
      entry.memberName.toLowerCase().includes(search) ||
      entry.memberId.toLowerCase().includes(search)
    );
  });
}
