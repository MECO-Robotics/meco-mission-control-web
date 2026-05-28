import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord } from "@/types/recordsExecution";
import type {
  DropdownOption,
  MembersById,
  SubsystemsById,
} from "@/features/workspace/shared/model/workspaceTypes";

export type WorkLogActivityGroupMode = "person" | "subsystem" | "task" | "action";

export type WorkLogActivityColumn = {
  actions: AuditActionRecord[];
  id: string;
  isFallback: boolean;
  label: string;
  sortRank: number;
};

export const DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE: WorkLogActivityGroupMode = "person";

export const WORK_LOG_ACTIVITY_GROUP_OPTIONS: DropdownOption[] = [
  { id: "person", name: "Person" },
  { id: "subsystem", name: "Subsystem" },
  { id: "task", name: "Task" },
  { id: "action", name: "Action" },
];

export const WORK_LOG_KANBAN_GROUP_OPTIONS: DropdownOption[] =
  WORK_LOG_ACTIVITY_GROUP_OPTIONS.filter((option) => option.id !== "person");

const ACTION_GROUP_RANK: Record<AuditActionRecord["operation"], number> = {
  create: 0,
  update: 1,
  delete: 2,
};

export function formatActivityLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

function getTaskSubsystemId(
  task: BootstrapPayload["tasks"][number] | undefined,
) {
  return task ? task.subsystemId || task.subsystemIds[0] || null : null;
}

function resolveActivityColumn({
  action,
  groupMode,
  membersById,
  subsystemsById,
  taskById,
}: {
  action: AuditActionRecord;
  groupMode: WorkLogActivityGroupMode;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
}): Omit<WorkLogActivityColumn, "actions"> {
  const task = action.taskId ? taskById[action.taskId] : undefined;

  if (groupMode === "person") {
    const personId = action.actorMemberId;

    if (!personId) {
      return {
        id: "person:system",
        isFallback: true,
        label: "System",
        sortRank: Number.MAX_SAFE_INTEGER,
      };
    }

    const person = membersById[personId];

    if (!person) {
      return {
        id: "person:unknown",
        isFallback: true,
        label: "Unknown member",
        sortRank: Number.MAX_SAFE_INTEGER - 1,
      };
    }

    return {
      id: `person:${personId}`,
      isFallback: false,
      label: person.name,
      sortRank: 0,
    };
  }

  if (groupMode === "subsystem") {
    const subsystemId = action.subsystemId ?? getTaskSubsystemId(task);

    if (!subsystemId) {
      return {
        id: "subsystem:unknown",
        isFallback: true,
        label: "Unknown subsystem",
        sortRank: Number.MAX_SAFE_INTEGER,
      };
    }

    return {
      id: `subsystem:${subsystemId}`,
      isFallback: false,
      label: subsystemsById[subsystemId]?.name ?? "Unknown subsystem",
      sortRank: 0,
    };
  }

  if (groupMode === "task") {
    if (!action.taskId) {
      return {
        id: "task:general",
        isFallback: true,
        label: "General activity",
        sortRank: Number.MAX_SAFE_INTEGER,
      };
    }

    return {
      id: `task:${action.taskId}`,
      isFallback: false,
      label: task?.title ?? action.entityLabel,
      sortRank: 0,
    };
  }

  return {
    id: `action:${action.operation}`,
    isFallback: false,
    label: formatActivityLabel(action.operation),
    sortRank: ACTION_GROUP_RANK[action.operation],
  };
}

export function buildWorkLogActivityColumns({
  actions,
  groupMode,
  membersById,
  subsystemsById,
  taskById,
}: {
  actions: AuditActionRecord[];
  groupMode: WorkLogActivityGroupMode;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
  taskById: Record<string, BootstrapPayload["tasks"][number]>;
}): WorkLogActivityColumn[] {
  const columnMap = new Map<string, WorkLogActivityColumn>();

  actions.forEach((action) => {
    const column = resolveActivityColumn({
      action,
      groupMode,
      membersById,
      subsystemsById,
      taskById,
    });
    const existing = columnMap.get(column.id);

    if (existing) {
      existing.actions.push(action);
      return;
    }

    columnMap.set(column.id, {
      ...column,
      actions: [action],
    });
  });

  return Array.from(columnMap.values()).sort((left, right) => {
    if (left.isFallback !== right.isFallback) {
      return left.isFallback ? 1 : -1;
    }

    if (left.sortRank !== right.sortRank) {
      return left.sortRank - right.sortRank;
    }

    return left.label.localeCompare(right.label);
  });
}
