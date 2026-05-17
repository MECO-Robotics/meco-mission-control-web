import { useCallback, useRef } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { IconChevronLeft, IconChevronRight } from "@/components/shared/Icons";
import { TaskQueueKanbanBoard } from "./TaskQueueKanbanBoard";
import {
  useTaskQueueBoardLazyLoading,
  useTaskQueueBoardScrollState,
  useTaskQueueBoardZoomInput,
} from "./useTaskQueueBoardInteractions";
import {
  clampTaskQueueZoom,
  shouldHideTaskQueueSummary,
  TASK_QUEUE_ZOOM_STEP,
} from "./taskQueueViewState";
import type { TaskQueueBoardState } from "./taskQueueKanbanBoardState";

interface TaskQueueBoardSectionProps {
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  focusedBoardState: TaskQueueBoardState | null;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord) => void;
  processedTasks: TaskRecord[];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  setFocusedBoardState: Dispatch<SetStateAction<TaskQueueBoardState | null>>;
  setTaskQueueZoom: Dispatch<SetStateAction<number>>;
  setVisibleTaskCount: Dispatch<SetStateAction<number>>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  taskFilterMotionClass: string;
  taskQueueZoom: number;
  visibleTaskCount: number;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export function TaskQueueBoardSection({
  bootstrap,
  disciplinesById,
  focusedBoardState,
  isNonRobotProject,
  membersById,
  openEditTaskModal,
  processedTasks,
  projectsById,
  setFocusedBoardState,
  setTaskQueueZoom,
  setVisibleTaskCount,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  taskFilterMotionClass,
  taskQueueZoom,
  visibleTaskCount,
  workstreamsById,
}: TaskQueueBoardSectionProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const taskQueueBoardShellRef = useRef<HTMLDivElement>(null);
  const scrollState = useTaskQueueBoardScrollState(taskQueueBoardShellRef);
  const zoomBoard = useCallback(
    (direction: 1 | -1) => {
      setTaskQueueZoom((current) => clampTaskQueueZoom(current + direction * TASK_QUEUE_ZOOM_STEP));
    },
    [setTaskQueueZoom],
  );
  const isFocused = focusedBoardState !== null;
  const boardTasks = isFocused ? processedTasks : processedTasks.slice(0, visibleTaskCount);
  const hasMoreTasks = !isFocused && visibleTaskCount < processedTasks.length;
  const loadedTaskLabel = `${Math.min(visibleTaskCount, processedTasks.length)} of ${processedTasks.length}`;
  const isCompactZoom = shouldHideTaskQueueSummary(taskQueueZoom);
  const boardStyle = {
    "--task-queue-zoom": taskQueueZoom,
    "--task-queue-board-column-width": `calc(15.5rem * ${taskQueueZoom})`,
    "--task-queue-board-focused-card-width": `calc(16rem * ${taskQueueZoom})`,
  } as CSSProperties;

  useTaskQueueBoardZoomInput(taskQueueBoardShellRef, zoomBoard);
  useTaskQueueBoardLazyLoading({
    isFocused,
    loadMoreRef,
    processedTaskCount: processedTasks.length,
    boardShellRef: taskQueueBoardShellRef,
    setVisibleTaskCount,
    visibleTaskCount,
  });

  return (
    <div
      className={`task-queue-board-shell-frame${scrollState.canScrollLeft ? " has-scroll-left" : ""}${scrollState.canScrollRight ? " has-scroll-right" : ""}${scrollState.hasOverflow ? " has-task-queue-board-overflow" : ""}${isFocused ? " is-focused-column" : ""} ${taskFilterMotionClass}`}
    >
      {scrollState.hasOverflow ? (
        <div aria-hidden="true" className="task-queue-board-scroll-hints">
          <div
            className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-left${
              scrollState.canScrollLeft ? "" : " is-hidden"
            }`}
          >
            <IconChevronLeft />
            <span className="task-queue-board-scroll-hint-label">Scroll</span>
          </div>
          <div
            className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-right${
              scrollState.canScrollRight ? "" : " is-hidden"
            }`}
          >
            <span className="task-queue-board-scroll-hint-label">Scroll</span>
            <IconChevronRight />
          </div>
        </div>
      ) : null}
      <div
        className={`table-shell task-queue-board-shell${isFocused ? " is-focused-column" : ""}`}
        data-task-queue-zoom-compact={isCompactZoom ? "true" : "false"}
        ref={taskQueueBoardShellRef}
        style={boardStyle}
      >
        {boardTasks.length > 0 ? (
          <TaskQueueKanbanBoard
            bootstrap={bootstrap}
            disciplinesById={disciplinesById}
            focusedState={focusedBoardState}
            isNonRobotProject={isNonRobotProject}
            membersById={membersById}
            openEditTaskModal={openEditTaskModal}
            projectsById={projectsById}
            taskQueueZoom={taskQueueZoom}
            showProjectContextOnCards={showProjectContextOnCards}
            showProjectOnCards={showProjectOnCards}
            onClearFocus={() => setFocusedBoardState(null)}
            onFocusState={setFocusedBoardState}
            subsystemsById={subsystemsById}
            tasks={boardTasks}
            workstreamsById={workstreamsById}
          />
        ) : (
          <p className="empty-state">No tasks match the current filters.</p>
        )}
        {!isFocused ? (
          <div className="task-queue-board-footer">
            <p className="task-queue-board-load-status">
              Showing {loadedTaskLabel} tasks
              {hasMoreTasks ? " - scroll to load more." : "."}
            </p>
            {hasMoreTasks ? (
              <div aria-hidden="true" className="task-queue-board-load-sentinel" ref={loadMoreRef} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
