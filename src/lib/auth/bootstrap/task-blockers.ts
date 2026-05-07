import type { TaskBlockerRecord } from "@/types/recordsExecution";
import type { LegacyBootstrapPayload } from "./shared";

export function normalizeBootstrapTaskBlockers(
  source: LegacyBootstrapPayload,
): TaskBlockerRecord[] {
  return (source.taskBlockers ?? []).map((blocker, index) => ({
    id: blocker.id ?? `task-blocker-${index + 1}`,
    blockedTaskId: blocker.blockedTaskId ?? "",
    blockerType: blocker.blockerType ?? "external",
    blockerId: blocker.blockerId ?? null,
    description: blocker.description ?? "",
    severity: blocker.severity ?? "medium",
    status: blocker.status ?? "open",
    createdByMemberId: blocker.createdByMemberId ?? null,
    createdAt: blocker.createdAt ?? new Date().toISOString(),
    resolvedAt: blocker.resolvedAt ?? null,
  }));
}
