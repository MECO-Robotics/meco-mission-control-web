import { TASK_BLOCKER_TYPE_LABELS, type TaskBlockerSourceKind } from "@/types/common";
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

export function normalizeBlockerSourceKind(kind: string | null | undefined): TaskBlockerSourceKind {
  return ["task", "milestone", "workstream", "mechanism", "part_instance", "artifact_instance", "external"].includes(kind ?? "") ? kind as TaskBlockerSourceKind : "external";
}

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
  return (source.taskBlockers ?? []).map(normalizeTaskBlockerRecord);
}

export function normalizeTaskBlockerRecord(blocker: Partial<Omit<TaskBlockerRecord, "blockerType">> & { blockerType?: string }, index = 0): TaskBlockerRecord {
  return {
    id: blocker.id ?? `task-blocker-${index + 1}`,
    blockedTaskId: blocker.blockedTaskId ?? "",
    blockerType: normalizeBlockerType(blocker.issueType ?? blocker.blockerType),
    blockerId: blocker.blockerId ?? null,
    sourceKind: normalizeBlockerSourceKind(blocker.sourceKind ?? blocker.blockerType),
    description: blocker.description ?? "",
    severity: blocker.severity ?? "medium",
    status: blocker.status ?? "open",
    createdByMemberId: blocker.createdByMemberId ?? null,
    createdAt: blocker.createdAt ?? new Date().toISOString(),
    resolvedAt: blocker.resolvedAt ?? null,
  };
}
