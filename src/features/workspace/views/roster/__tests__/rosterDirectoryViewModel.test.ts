/// <reference types="jest" />

import { filterRosterMembers, sortMembersByElevation } from "../rosterDirectoryViewModel";
import type { MemberRecord } from "@/types/recordsOrganization";

const member = (id: string, name: string, elevated = false): MemberRecord => ({
  id,
  name,
  email: `${id}@example.com`,
  role: "student",
  elevated,
  seasonId: "season-1",
  disciplineId: "mechanical",
});

describe("roster directory view model", () => {
  it("sorts prioritized members before name-sorted peers", () => {
    const rows = [member("zoe", "Zoe"), member("alex", "Alex", true), member("blair", "Blair")];
    expect(sortMembersByElevation(rows, (row) => row.elevated).map((row) => row.id))
      .toEqual(["alex", "blair", "zoe"]);
  });

  it("searches member details and their discipline label", () => {
    const rows = [member("alex", "Alex"), member("zoe", "Zoe")];
    const filtered = filterRosterMembers({
      members: rows,
      peopleFilter: "all",
      presentMemberIds: new Set(),
      presenceById: new Map(),
      insightById: new Map(),
      searchText: "mechanical",
      disciplineById: { mechanical: "Mechanical Engineering" },
    });

    expect(filtered.map((row) => row.id)).toEqual(["alex", "zoe"]);
  });
});
