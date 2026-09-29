import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { formatDate } from "@/lib/appUtils/common";
import type { TaskPriority } from "@/types/common";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { TaskRecord } from "@/types/recordsExecution";
import { EditableHoverIndicator, RequestedItemMeta } from "@/features/workspace/shared/table/workspaceTableChrome";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { MANUFACTURING_STATUS_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { getMemberInitial, getTaskCardPerson, TaskPriorityBadge } from "@/features/workspace/views/taskQueue/taskQueueKanbanCardMeta";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const MANUFACTURING_BOARD_STATES: readonly ManufacturingItemRecord["status"][] = [
  "requested",
  "approved",
  "in-progress",
  "qa",
  "complete",
];

interface ManufacturingKanbanBoardProps {
  items: ManufacturingItemRecord[];
  membersById: MembersById;
  projectsById: Record<string, { id: string; name: string }>;
  tasks: TaskRecord[];
  onEdit: (item: ManufacturingItemRecord) => void;
  onQuickStatusChange?: (
    item: ManufacturingItemRecord,
    status: ManufacturingItemRecord["status"],
  ) => Promise<void>;
  showInHouseDetails?: boolean;
  showMentorQuickActions?: boolean;
  subsystemsById: SubsystemsById;
  tutorialTarget?: (suffix: string) => string | undefined;
}

export function ManufacturingKanbanBoard({
  items,
  membersById,
  projectsById,
  tasks,
  onEdit,
  onQuickStatusChange,
  showInHouseDetails = false,
  showMentorQuickActions = false,
  subsystemsById,
  tutorialTarget,
}: ManufacturingKanbanBoardProps) {
  const [pendingQuickActionKey, setPendingQuickActionKey] = useState<string | null>(null);
  const pendingQuickActionKeyRef = useRef<string | null>(null);
  const canShowMentorQuickActions = Boolean(showMentorQuickActions && onQuickStatusChange);
  const taskByManufacturingId = useMemo(() => {
    const linkedTasks = new Map<string, TaskRecord>();

    for (const task of tasks) {
      for (const manufacturingId of task.linkedManufacturingIds ?? []) {
        const currentTask = linkedTasks.get(manufacturingId);
        if (!currentTask || PRIORITY_ORDER[task.priority] < PRIORITY_ORDER[currentTask.priority]) {
          linkedTasks.set(manufacturingId, task);
        }
      }
    }

    return linkedTasks;
  }, [tasks]);

  const itemsByStatus = useMemo(() => {
    const grouped: Record<ManufacturingItemRecord["status"], ManufacturingItemRecord[]> = {
      requested: [],
      approved: [],
      "in-progress": [],
      qa: [],
      complete: [],
    };

    for (const item of items) {
      grouped[item.status].push(item);
    }

    return grouped;
  }, [items]);

  const handleCardKeyDown = (milestone: KeyboardEvent<HTMLDivElement>, item: ManufacturingItemRecord) => {
    if (milestone.key === "Enter" || milestone.key === " ") {
      milestone.preventDefault();
      onEdit(item);
    }
  };

  const runQuickStatusChange = async (
    item: ManufacturingItemRecord,
    nextStatus: ManufacturingItemRecord["status"],
  ) => {
    if (!onQuickStatusChange) {
      return;
    }

    const actionKey = `${item.id}:${nextStatus}`;
    if (pendingQuickActionKeyRef.current) {
      return;
    }

    pendingQuickActionKeyRef.current = actionKey;
    setPendingQuickActionKey(actionKey);
    try {
      await onQuickStatusChange(item, nextStatus);
    } finally {
      if (pendingQuickActionKeyRef.current === actionKey) {
        pendingQuickActionKeyRef.current = null;
        setPendingQuickActionKey(null);
      }
    }
  };

  const handleQuickStatusChange = (
    milestone: MouseEvent<HTMLButtonElement>,
    item: ManufacturingItemRecord,
    nextStatus: ManufacturingItemRecord["status"],
  ) => {
    milestone.preventDefault();
    milestone.stopPropagation();
    void runQuickStatusChange(item, nextStatus);
  };

  return (
    <KanbanColumns
      boardClassName="task-queue-board"
      canDragItem={(item) => canShowMentorQuickActions && item.process === "cnc"}
      canDropItem={(item, state) => canShowMentorQuickActions && item.process === "cnc" && item.status !== state}
      columnBodyClassName="task-queue-board-column-body"
      columnClassName="task-queue-board-column"
      columnCountClassName="task-queue-board-column-count"
      columnEmptyClassName="task-queue-board-column-empty"
      columnHeaderClassName="task-queue-board-column-header"
      columns={MANUFACTURING_BOARD_STATES.map((state) => ({
        state,
        count: itemsByStatus[state].length,
        header: (
          <span className={getStatusPillClassName(state)}>
            <span className="task-queue-board-column-header-label">
              {MANUFACTURING_STATUS_OPTIONS.find((option) => option.id === state)?.name}
            </span>
          </span>
        ),
      }))}
      emptyLabel="No jobs"
      getItemDragLabel={(item) => item.title}
      getItemId={(item) => item.id}
      itemsByState={itemsByStatus}
      onItemDrop={
        canShowMentorQuickActions ? (item, state) => runQuickStatusChange(item, state) : undefined
      }
      renderItem={(item, _state, dragProps) => {
        const approveActionKey = `${item.id}:approved`;
        const completeActionKey = `${item.id}:complete`;
        const isApprovePending = pendingQuickActionKey === approveActionKey;
        const isCompletePending = pendingQuickActionKey === completeActionKey;
        const isAnyActionPending = Boolean(pendingQuickActionKey);
        const projectId = subsystemsById[item.subsystemId]?.projectId;
        const projectName = projectId
          ? projectsById[projectId]?.name ?? "Unknown project"
          : "Unknown project";
        const linkedTask = taskByManufacturingId.get(item.id);
        const priority = linkedTask?.priority;
        const person = (linkedTask ? getTaskCardPerson(linkedTask, membersById) : null)
          ?? (item.requestedById ? membersById[item.requestedById] ?? null : null);
        const { className: dragClassName, ...dragRootProps } = dragProps ?? {};
        const cardClassName = `task-queue-board-card editable-hover-target editable-hover-target-row${
          dragClassName ? ` ${dragClassName}` : ""
        }`;

        const cardContent = (
          <>
            <div className="task-queue-board-card-header">
              <RequestedItemMeta
                item={item}
                membersById={membersById}
                subsystemsById={subsystemsById}
              />
              <span className="task-queue-board-card-due">Due {formatDate(item.dueDate)}</span>
            </div>
            <small className="task-queue-board-card-summary">
              {item.material}
              {" · "}
              Qty {item.quantity}
              {" · "}
              {item.batchLabel ?? "Unbatched"}
              {showInHouseDetails && item.process === "cnc" ? ` · ${item.inHouse ? "In-house" : "Outsourced"}` : ""}
            </small>
            <div className="task-queue-board-card-meta">
              <span title={projectName}>{projectName}</span>
              {priority || person ? (
                <div className="task-queue-board-card-meta-person-group">
                  {priority ? <TaskPriorityBadge priority={priority} /> : null}
                  {person ? (
                    <span className="task-queue-board-card-person" title={person.name}>
                      {person.photoUrl ? (
                        <img
                          alt={`${person.name} profile picture`}
                          className="profile-avatar"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          src={person.photoUrl}
                        />
                      ) : (
                        <span className="profile-avatar profile-avatar-fallback" aria-hidden="true">
                          {getMemberInitial(person)}
                        </span>
                      )}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {canShowMentorQuickActions && item.process === "cnc" ? (
              <div className="task-queue-board-card-meta" style={{ justifyContent: "flex-start" }}>
                <button
                  className="icon-button"
                  data-tutorial-target={tutorialTarget?.("approve-job-button")}
                  disabled={isAnyActionPending || item.status !== "requested"}
                  onClick={(milestone) => handleQuickStatusChange(milestone, item, "approved")}
                  style={{ padding: "0.15rem 0.4rem" }}
                  type="button"
                >
                  {isApprovePending ? "Approving..." : "Approve"}
                </button>
                <button
                  className="icon-button"
                  data-tutorial-target={tutorialTarget?.("complete-job-button")}
                  disabled={isAnyActionPending || item.status === "complete"}
                  onClick={(milestone) => handleQuickStatusChange(milestone, item, "complete")}
                  style={{ padding: "0.15rem 0.4rem" }}
                  type="button"
                >
                  {isCompletePending ? "Completing..." : "Complete"}
                </button>
              </div>
            ) : null}
            <EditableHoverIndicator className="task-queue-board-card-hover" />
          </>
        );

        if (canShowMentorQuickActions) {
          return (
            <div
              {...dragRootProps}
              className={cardClassName}
              data-tutorial-target={tutorialTarget?.("edit-job-row")}
              key={item.id}
              onClick={() => onEdit(item)}
              onKeyDown={(milestone) => handleCardKeyDown(milestone, item)}
              role="button"
              tabIndex={0}
            >
              {cardContent}
            </div>
          );
        }

        return (
          <button
            {...dragRootProps}
            className={cardClassName}
            data-tutorial-target={tutorialTarget?.("edit-job-row")}
            key={item.id}
            onClick={() => onEdit(item)}
            type="button"
          >
            {cardContent}
          </button>
        );
      }}
    />
  );
}
