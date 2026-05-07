import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord, TaskRecord } from "@/types/recordsExecution";

export interface TimelineMilestoneDraft {
  title: string;
  type: MilestoneRecord["type"];
  isExternal: boolean;
  description: string;
  projectIds: string[];
}

export interface HoveredMilestonePopup {
  anchorStartDay: string | null;
  anchorEndDay: string | null;
  rotationDeg: 45 | 90;
  lines: string[];
  lineOffsets: number[];
  background: string;
  color: string;
}

export function formatTaskAssignees(
  task: TaskRecord,
  membersById: Record<string, BootstrapPayload["members"][number]>,
) {
  const taskAssigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  const assigneeIds =
    taskAssigneeIds.length > 0
      ? taskAssigneeIds
      : task.ownerId
        ? [task.ownerId]
        : [];

  if (assigneeIds.length === 0) {
    return "Unassigned";
  }

  return assigneeIds.map((assigneeId) => membersById[assigneeId]?.name ?? "Unknown").join(", ");
}

export function emptyTimelineMilestoneDraft(defaultMilestoneType: MilestoneRecord["type"]): TimelineMilestoneDraft {
  return {
    title: "",
    type: defaultMilestoneType,
    isExternal: false,
    description: "",
    projectIds: [],
  };
}

export function timelineMilestoneDraftFromRecord(record: MilestoneRecord): TimelineMilestoneDraft {
  return {
    title: record.title,
    type: record.type,
    isExternal: record.isExternal,
    description: record.description,
    projectIds: record.projectIds,
  };
}

function areSameLines(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function areSameOffsets(left: number[], right: number[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function isSameHoveredMilestonePopup(
  left: HoveredMilestonePopup | null,
  right: HoveredMilestonePopup | null,
) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.anchorStartDay === right.anchorStartDay &&
    left.anchorEndDay === right.anchorEndDay &&
    left.rotationDeg === right.rotationDeg &&
    left.background === right.background &&
    left.color === right.color &&
    areSameLines(left.lines, right.lines) &&
    areSameOffsets(left.lineOffsets, right.lineOffsets)
  );
}
