import { useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import type { BootstrapPayload, TaskRecord } from "@/types";
import { IconChevronLeft, IconChevronRight } from "@/components/shared";
import type { TaskQueueBoardState } from "./taskQueueKanban";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "./taskQueueKanban";
import { TaskQueueKanbanBoard } from "./TaskQueueKanbanBoard";

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
  setVisibleTaskCount: Dispatch<SetStateAction<number>>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  taskFilterMotionClass: string;
  visibleTaskCount: number;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

function useTaskQueueBoardScrollState(boardShellRef: RefObject<HTMLDivElement | null>) {
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });

  useEffect(() => {
    const shell = boardShellRef.current;
    if (!shell) {
      setScrollState({
        canScrollLeft: false,
        canScrollRight: false,
        hasOverflow: false,
      });
      return;
    }

    const updateScrollState = () => {
      const maxScrollLeft = Math.max(0, shell.scrollWidth - shell.clientWidth);
      const nextHasOverflow = shell.scrollWidth > shell.clientWidth + 4;
      const nextCanScrollLeft = nextHasOverflow && shell.scrollLeft > 4;
      const nextCanScrollRight = nextHasOverflow && shell.scrollLeft < maxScrollLeft - 4;

      setScrollState((current) =>
        current.hasOverflow === nextHasOverflow &&
        current.canScrollLeft === nextCanScrollLeft &&
        current.canScrollRight === nextCanScrollRight
          ? current
          : {
              canScrollLeft: nextCanScrollLeft,
              canScrollRight: nextCanScrollRight,
              hasOverflow: nextHasOverflow,
            },
      );
    };

    let rafId: number | undefined;
    const scheduleScrollStateUpdate = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        updateScrollState();
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleScrollStateUpdate);

    resizeObserver?.observe(shell);
    shell.addEventListener("scroll", scheduleScrollStateUpdate, { passive: true });
    window.addEventListener("resize", scheduleScrollStateUpdate);
    updateScrollState();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      resizeObserver?.disconnect();
      shell.removeEventListener("scroll", scheduleScrollStateUpdate);
      window.removeEventListener("resize", scheduleScrollStateUpdate);
    };
  }, [boardShellRef]);

  return scrollState;
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
  setVisibleTaskCount,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  taskFilterMotionClass,
  visibleTaskCount,
  workstreamsById,
}: TaskQueueBoardSectionProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const taskQueueBoardShellRef = useRef<HTMLDivElement>(null);
  const scrollState = useTaskQueueBoardScrollState(taskQueueBoardShellRef);
  const isFocused = focusedBoardState !== null;
  const boardTasks = isFocused ? processedTasks : processedTasks.slice(0, visibleTaskCount);
  const hasMoreTasks = !isFocused && visibleTaskCount < processedTasks.length;
  const loadedTaskLabel = `${Math.min(visibleTaskCount, processedTasks.length)} of ${processedTasks.length}`;

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isFocused ||
      visibleTaskCount >= processedTasks.length
    ) {
      return;
    }

    const loadMore = () => {
      setVisibleTaskCount((current) =>
        Math.min(current + TASK_QUEUE_LAZY_LOAD_BATCH_SIZE, processedTasks.length),
      );
    };

    const maybeLoadMore = () => {
      const sentinel = loadMoreRef.current;
      if (!sentinel) {
        return;
      }

      const sentinelRect = sentinel.getBoundingClientRect();
      if (sentinelRect.top <= window.innerHeight + 240) {
        loadMore();
      }
    };

    let rafId: number | undefined;
    const handleScroll = () => {
      if (rafId !== undefined) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = undefined;
        maybeLoadMore();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    maybeLoadMore();

    return () => {
      if (rafId !== undefined) {
        window.cancelAnimationFrame(rafId);
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isFocused, processedTasks.length, setVisibleTaskCount, visibleTaskCount]);

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
        ref={taskQueueBoardShellRef}
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
