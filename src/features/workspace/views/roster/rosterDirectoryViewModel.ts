import type { MemberRecord } from "@/types/recordsOrganization";
import type { RosterInsightsMember } from "@/types/rosterInsights";
import type { AvailableStudentRosterRow } from "./availableStudentsRoster";

export type RosterPeopleFilter = "all" | "present" | "available" | "overloaded";

export function sortMembersByName<T extends { name: string }>(members: T[]) {
  return [...members].sort((left, right) => left.name.localeCompare(right.name));
}

export function sortMembersByElevation<T extends MemberRecord>(
  members: T[],
  isElevated: (member: T) => boolean,
) {
  return [...members].sort((left, right) =>
    Number(isElevated(right)) - Number(isElevated(left)) || left.name.localeCompare(right.name),
  );
}

export function filterRosterMembers(args: {
  members: MemberRecord[];
  peopleFilter: RosterPeopleFilter;
  presentMemberIds: ReadonlySet<string>;
  presenceById: ReadonlyMap<string, AvailableStudentRosterRow>;
  insightById: ReadonlyMap<string, RosterInsightsMember>;
  searchText: string;
  groupNamesByMemberId: ReadonlyMap<string, readonly string[]>;
}) {
  const { members, peopleFilter, presentMemberIds, presenceById, insightById, groupNamesByMemberId } = args;
  const scoped = members.filter((member) => {
    if (peopleFilter === "present") return presentMemberIds.has(member.id);
    if (peopleFilter === "available") return presenceById.get(member.id)?.state === "available";
    if (peopleFilter === "overloaded") return insightById.get(member.id)?.availabilityStatus === "overloaded";
    return true;
  });
  const query = args.searchText.trim().toLowerCase();
  if (!query) return scoped;

  return scoped.filter((member) => [
    member.name,
    member.email,
    member.role,
    member.elevated ? "elevated" : "",
    (groupNamesByMemberId.get(member.id) ?? []).join(" "),
  ].join(" ").toLowerCase().includes(query));
}
