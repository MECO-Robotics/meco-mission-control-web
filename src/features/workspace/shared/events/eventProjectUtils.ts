import type { MeetingRecord, MilestoneRecord } from "@/types/recordsExecution";

function uniqueIds(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}

export function getMilestoneProjectIds(
  milestone: Pick<MilestoneRecord, "projectIds">,
) {
  return Array.isArray(milestone.projectIds) ? uniqueIds(milestone.projectIds) : [];
}

export function getMeetingProjectIds(meeting: Pick<MeetingRecord, "projectIds">) {
  return Array.isArray(meeting.projectIds) ? uniqueIds(meeting.projectIds) : [];
}

export function isProjectScopedEventVisible(
  projectIds: string[],
  activeProjectIds: ReadonlySet<string>,
) {
  return projectIds.length === 0 || projectIds.some((projectId) => activeProjectIds.has(projectId));
}

export function isMeetingVisibleInProjectScope(
  meeting: Pick<MeetingRecord, "projectIds">,
  activeProjectIds: ReadonlySet<string>,
) {
  return isProjectScopedEventVisible(getMeetingProjectIds(meeting), activeProjectIds);
}
