import type { TaskRecord } from "@/types/recordsExecution";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";

import type { WorkLogActiveBoard, WorkLogActiveBoardCard } from "./workLogsActiveBoard";

interface WorkLogsActiveBoardSectionProps {
  board: WorkLogActiveBoard;
  openEditTaskModal: (task: TaskRecord) => void;
}

const STATE_STATUS_VALUE: Record<WorkLogActiveBoardCard["state"], string> = {
  active: "in-progress",
  paused: "waiting",
  blocked: "blocked",
  "waiting-qa": "waiting-for-qa",
  closed: "complete",
};

function WorkLogActiveBoardCard({
  card,
  openEditTaskModal,
}: {
  card: WorkLogActiveBoardCard;
  openEditTaskModal: (task: TaskRecord) => void;
}) {
  return (
    <article className="task-queue-board-card worklog-active-board-card">
      <div className="worklog-active-board-card-head">
        {card.task ? (
          <button
            className="worklog-active-board-task"
            onClick={() => openEditTaskModal(card.task as TaskRecord)}
            type="button"
          >
            {card.taskLabel}
          </button>
        ) : (
          <strong className="worklog-active-board-task">{card.taskLabel}</strong>
        )}
        {card.needsHelp ? <span className="worklog-active-board-help">Need help</span> : null}
      </div>
      <p className="worklog-active-board-student">{card.studentLabel}</p>
      <div className="worklog-active-board-activity">
        <span>{card.elapsedLabel}</span>
        <span>{card.recentActivityLabel}</span>
      </div>
      <p
        className={`worklog-active-board-blocker${
          card.state === "blocked" ? " worklog-active-board-blocker-alert" : ""
        }`}
      >
        {card.blockerLabel}
      </p>
    </article>
  );
}

export function WorkLogsActiveBoardSection({
  board,
  openEditTaskModal,
}: WorkLogsActiveBoardSectionProps) {
  return (
    <>
      <p className="section-copy filter-copy">
        Live worklog status by linked task state, with help requests called out separately.
      </p>
      <KanbanScrollFrame>
        <div className="worklog-active-board">
          {board.columns.map((column) => {
            const cards = board.itemsByState[column.state];

            return (
              <section className="task-queue-board-column" key={column.state}>
                <div className="task-queue-board-column-header">
                  <span className={getStatusPillClassName(STATE_STATUS_VALUE[column.state])}>
                    <span className="task-queue-board-column-header-label">{column.label}</span>
                  </span>
                  <span className="task-queue-board-column-count">{cards.length}</span>
                </div>
                <div className="task-queue-board-column-body">
                  {cards.length > 0 ? (
                    cards.map((card) => (
                      <WorkLogActiveBoardCard
                        card={card}
                        key={card.id}
                        openEditTaskModal={openEditTaskModal}
                      />
                    ))
                  ) : (
                    <div className="task-queue-board-column-empty worklog-active-board-empty">
                      <strong>{column.emptyTitle}</strong>
                      <span>{column.emptyCopy}</span>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </KanbanScrollFrame>
    </>
  );
}
