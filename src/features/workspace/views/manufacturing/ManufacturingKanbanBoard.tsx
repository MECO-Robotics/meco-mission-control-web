import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";

import { formatDate } from "@/lib/appUtils/common";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import { EditableHoverIndicator, RequestedItemMeta } from "@/features/workspace/shared/table/workspaceTableChrome";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";

const MANUFACTURING_BOARD_STATES: readonly ManufacturingItemRecord["status"][] = [
  "requested",
  "approved",
  "in-progress",
  "qa",
  "complete",
];

const MANUFACTURING_STATUS_LABELS: Record<ManufacturingItemRecord["status"], string> = {
  requested: "Requested",
  approved: "Approved",
  "in-progress": "In progress",
  qa: "QA",
  complete: "Complete",
};

interface ManufacturingKanbanBoardProps {
  items: ManufacturingItemRecord[];
  membersById: MembersById;
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
  onEdit,
  onQuickStatusChange,
  showInHouseDetails = false,
  showMentorQuickActions = false,
  subsystemsById,
  tutorialTarget,
}: ManufacturingKanbanBoardProps) {
  const [pendingQuickActionKey, setPendingQuickActionKey] = useState<string | null>(null);
  const canShowMentorQuickActions = Boolean(showMentorQuickActions && onQuickStatusChange);

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

  const handleQuickStatusChange = async (
    milestone: MouseEvent<HTMLButtonElement>,
    item: ManufacturingItemRecord,
    nextStatus: ManufacturingItemRecord["status"],
  ) => {
    milestone.preventDefault();
    milestone.stopPropagation();
    if (!onQuickStatusChange) {
      return;
    }

    const actionKey = `${item.id}:${nextStatus}`;
    if (pendingQuickActionKey) {
      return;
    }

    setPendingQuickActionKey(actionKey);
    try {
      await onQuickStatusChange(item, nextStatus);
    } finally {
      setPendingQuickActionKey(null);
    }
  };

  return (
    <KanbanColumns
      boardClassName="task-queue-board"
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
              {MANUFACTURING_STATUS_LABELS[state]}
            </span>
          </span>
        ),
      }))}
      emptyLabel="No jobs"
      itemsByState={itemsByStatus}
      renderItem={(item) => {
        const approveActionKey = `${item.id}:approved`;
        const completeActionKey = `${item.id}:complete`;
        const isApprovePending = pendingQuickActionKey === approveActionKey;
        const isCompletePending = pendingQuickActionKey === completeActionKey;
        const isAnyActionPending = Boolean(pendingQuickActionKey);

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
              {showInHouseDetails ? ` · ${item.inHouse ? "In-house" : "Outsourced"}` : ""}
            </small>
            <div className="task-queue-board-card-meta">
              <span className={getStatusPillClassName(item.status)}>
                {item.status.replace("-", " ")}
              </span>
              <span
                style={{
                  alignItems: "center",
                  display: "inline-flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                }}
              >
                <span>{item.mentorReviewed ? "Reviewed" : "Pending"}</span>
                {canShowMentorQuickActions ? (
                  <>
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
                  </>
                ) : null}
              </span>
            </div>
            <EditableHoverIndicator className="task-queue-board-card-hover" />
          </>
        );

        if (canShowMentorQuickActions) {
          return (
            <div
              className="task-queue-board-card editable-hover-target editable-hover-target-row"
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
            className="task-queue-board-card editable-hover-target editable-hover-target-row"
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
