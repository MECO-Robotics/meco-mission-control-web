import { TASK_BLOCKER_TYPE_LABELS } from "@/types/common";
import type { TaskBlockerRecord } from "@/types/recordsExecution";
import type { LegacyBootstrapPayload } from "./shared";

const LEGACY_BLOCKER_TYPE_FALLBACKS: Record<string, TaskBlockerRecord["blockerType"]> = {
  artifact_instance: "other",
  mechanism: "design-issue",
  milestone: "other",
  part_instance: "lost-part",
  task: "other",
  workstream: "other",
};

function normalizeBlockerType(blockerType: string | undefined): TaskBlockerRecord["blockerType"] {
  if (!blockerType) {
    return "other";
  }

  const normalizedType = LEGACY_BLOCKER_TYPE_FALLBACKS[blockerType] ?? blockerType;
  return normalizedType in TASK_BLOCKER_TYPE_LABELS
    ? (normalizedType as TaskBlockerRecord["blockerType"])
    : "other";
}

export function normalizeBootstrapTaskBlockers(
  source: LegacyBootstrapPayload,
): TaskBlockerRecord[] {
  return (source.taskBlockers ?? []).map((blocker, index) => ({
    id: blocker.id ?? `task-blocker-${index + 1}`,
    blockedTaskId: blocker.blockedTaskId ?? "",
    blockerType: normalizeBlockerType(blocker.blockerType),
    blockerId: blocker.blockerId ?? null,
    sourceKind: blocker.blockerType ?? null,
    description: blocker.description ?? "",
    severity: blocker.severity ?? "medium",
    status: blocker.status ?? "open",
    createdByMemberId: blocker.createdByMemberId ?? null,
    createdAt: blocker.createdAt ?? new Date().toISOString(),
    resolvedAt: blocker.resolvedAt ?? null,
  }));
}
