import type { MilestoneRecord } from "@/types/recordsExecution";

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
