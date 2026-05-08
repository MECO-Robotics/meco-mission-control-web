import type { BootstrapPayload } from "@/types/bootstrap";
import type { RosterInsightsResponse } from "@/types/rosterInsights";

interface RosterInsightsScopeArgs {
  projectId: string | null;
  seasonId: string | null;
}

export function isMemberInSeason(
  member: BootstrapPayload["members"][number],
  seasonId: string | null,
) {
  if (!seasonId) {
    return true;
  }

  return member.seasonId === seasonId || Boolean(member.activeSeasonIds?.includes(seasonId));
}

export function getScopedRosterSeasonId(
  bootstrap: BootstrapPayload,
  scope: RosterInsightsScopeArgs,
) {
  const scopedProject = scope.projectId
    ? bootstrap.projects.find((project) => project.id === scope.projectId) ?? null
    : null;

  return scope.seasonId ?? scopedProject?.seasonId ?? null;
}

export function getScopedRosterMemberIds(
  bootstrap: BootstrapPayload,
  scope: RosterInsightsScopeArgs,
) {
  const scopedSeasonId = getScopedRosterSeasonId(bootstrap, scope);
  return new Set(
    bootstrap.members
      .filter((member) => isMemberInSeason(member, scopedSeasonId))
      .map((member) => member.id),
  );
}

export function areRosterInsightsRowsInScope(
  insights: RosterInsightsResponse,
  scopedMemberIds: ReadonlySet<string>,
) {
  const responseMembersAreInScope = insights.members.every((member) =>
    scopedMemberIds.has(member.memberId),
  );
  const recentAttendanceMembersAreInScope = insights.recentAttendance.every((record) =>
    scopedMemberIds.has(record.memberId),
  );
  const memberIdsInResponse = new Set(insights.members.map((member) => member.memberId));
  const recentAttendanceHasKnownMembers = insights.recentAttendance.every((record) =>
    memberIdsInResponse.has(record.memberId),
  );
  const noUnknownMemberFallbackRows = insights.recentAttendance.every(
    (record) => record.memberName.trim().toLowerCase() !== "unknown member",
  );

  return (
    responseMembersAreInScope &&
    recentAttendanceMembersAreInScope &&
    recentAttendanceHasKnownMembers &&
    noUnknownMemberFallbackRows
  );
}
