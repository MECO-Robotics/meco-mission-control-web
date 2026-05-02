import { useEffect, useRef, useState } from "react";

import type { BootstrapPayload, TaskRecord } from "@/types";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSort,
} from "@/components/shared";
import { SearchToolbarInput } from "@/features/workspace/shared/WorkspaceViewShared";
import { CompactFilterMenu } from "@/features/workspace/shared/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/workspaceFilterUtils";
import { WORKSPACE_PANEL_CLASS } from "@/features/workspace/shared/workspaceTypes";
import { TASK_QUEUE_LAZY_LOAD_BATCH_SIZE } from "./taskQueueKanban";
import { TaskQueueKanbanBoard } from "./TaskQueueKanbanBoard";
import { TaskQueueCompactFilterMenu } from "./TaskQueueCompactFilterMenu";
import {
  SORT_DIRECTION_OPTIONS,
  TASK_SORT_OPTIONS,
  type TaskSortField,
  useTaskQueueViewState,
} from "./taskQueueViewState";

interface TaskQueueViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplinesById: Record<string, BootstrapPayload["disciplines"][number]>;
  isAllProjectsView: boolean;
  isNonRobotProject: boolean;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openCreateTaskModal: () => void;
  openEditTaskModal: (task: TaskRecord) => void;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function TaskQueueView({
  activePersonFilter,
  bootstrap,
  disciplinesById,
  isAllProjectsView,
  isNonRobotProject,
  membersById,
  openCreateTaskModal,
  openEditTaskModal,
  subsystemsById,
}: TaskQueueViewProps) {
  const {
    activeFilterCount,
    activePersonFilterLabel,
    disciplineFilter,
    disciplineOptions,
    focusedBoardState,
    ownerFilter,
    priorityFilter,
    processedTasks,
    projectFilter,
    projectsById,
    searchFilter,
    setDisciplineFilter,
    setFocusedBoardState,
    setOwnerFilter,
    setPriorityFilter,
    setProjectFilter,
    setSearchFilter,
    setSortField,
    setSortOrder,
    setStatusFilter,
    setSubsystemFilter,
    setSubsystemIterationFilter,
    setVisibleTaskCount,
    sortField,
    sortOrder,
    statusFilter,
    subsystemFilter,
    subsystemFilterOptions,
    subsystemIterationFilter,
    subsystemIterationOptions,
    taskFilterMotionClass,
    taskSortIsDefault,
    visibleTaskCount,
    workstreamsById,
    showProjectContextOnCards,
    showProjectOnCards,
    showSubsystemIterationFilter,
  } = useTaskQueueViewState({
    activePersonFilter,
    bootstrap,
    disciplinesById,
    isAllProjectsView,
    membersById,
    subsystemsById,
  });

  const [taskQueueBoardScrollState, setTaskQueueBoardScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const taskQueueBoardShellRef = useRef<HTMLDivElement>(null);
  const isFocused = focusedBoardState !== null;
  const boardTasks = isFocused ? processedTasks : processedTasks.slice(0, visibleTaskCount);
  const hasMoreTasks = !isFocused && visibleTaskCount < processedTasks.length;
  const loadedTaskLabel = `${Math.min(visibleTaskCount, processedTasks.length)} of ${processedTasks.length}`;

  useEffect(() => {
    const shell = taskQueueBoardShellRef.current;
    if (!shell) {
      setTaskQueueBoardScrollState({
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

      setTaskQueueBoardScrollState((current) =>
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
  }, [processedTasks.length, visibleTaskCount]);

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
  }, [isFocused, processedTasks.length, visibleTaskCount, setVisibleTaskCount]);

  return (
    <section className={`panel dense-panel task-queue-view ${WORKSPACE_PANEL_CLASS}`}>
      <div className="panel-header compact-header">
        <div className="queue-section-header">
          <h2>Task kanban</h2>
          <p className="section-copy filter-copy">
            {activePersonFilter.length === 0
              ? "All tasks in kanban."
              : `Only tasks assigned to or mentored by ${activePersonFilterLabel}.`}
          </p>
        </div>
        <div className="panel-actions filter-toolbar task-queue-toolbar">
          <div data-tutorial-target="task-queue-search-input">
            <SearchToolbarInput
              ariaLabel="Search tasks"
              onChange={setSearchFilter}
              placeholder="Search tasks..."
              value={searchFilter}
            />
          </div>

          <TaskQueueCompactFilterMenu
            activeFilterCount={activeFilterCount}
            bootstrap={bootstrap}
            disciplineFilter={disciplineFilter}
            disciplineOptions={disciplineOptions}
            isAllProjectsView={isAllProjectsView}
            ownerFilter={ownerFilter}
            priorityFilter={priorityFilter}
            projectFilter={projectFilter}
            setDisciplineFilter={setDisciplineFilter}
            setOwnerFilter={setOwnerFilter}
            setPriorityFilter={setPriorityFilter}
            setProjectFilter={setProjectFilter}
            setStatusFilter={setStatusFilter}
            setSubsystemFilter={setSubsystemFilter}
            setSubsystemIterationFilter={setSubsystemIterationFilter}
            showSubsystemIterationFilter={showSubsystemIterationFilter}
            statusFilter={statusFilter}
            subsystemFilter={subsystemFilter}
            subsystemFilterOptions={subsystemFilterOptions}
            subsystemIterationFilter={subsystemIterationFilter}
            subsystemIterationOptions={subsystemIterationOptions}
          />

          <CompactFilterMenu
            activeCount={taskSortIsDefault ? 0 : 1}
            ariaLabel="Sort tasks"
            buttonLabel="Sort"
            className="task-queue-sort-menu"
            icon={<IconSort />}
            items={[
              {
                label: "Sort by",
                content: (
                  <select
                    aria-label="Sort tasks by"
                    className="task-queue-sort-menu-select"
                    onChange={(event) => setSortField(event.target.value as TaskSortField)}
                    value={sortField}
                  >
                    {TASK_SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                label: "Direction",
                content: (
                  <select
                    aria-label="Sort direction"
                    className="task-queue-sort-menu-select"
                    onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                    value={sortOrder}
                  >
                    {SORT_DIRECTION_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />

          <button
            aria-label="Add task"
            className="primary-action queue-toolbar-action"
            data-tutorial-target="create-task-button"
            onClick={openCreateTaskModal}
            title="Add task"
            type="button"
          >
            Add
          </button>
        </div>
      </div>

      <div
        className={`task-queue-board-shell-frame${taskQueueBoardScrollState.canScrollLeft ? " has-scroll-left" : ""}${taskQueueBoardScrollState.canScrollRight ? " has-scroll-right" : ""}${taskQueueBoardScrollState.hasOverflow ? " has-task-queue-board-overflow" : ""}${isFocused ? " is-focused-column" : ""} ${taskFilterMotionClass}`}
      >
        {taskQueueBoardScrollState.hasOverflow ? (
          <div aria-hidden="true" className="task-queue-board-scroll-hints">
            <div
              className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-left${
                taskQueueBoardScrollState.canScrollLeft ? "" : " is-hidden"
              }`}
            >
              <IconChevronLeft />
              <span className="task-queue-board-scroll-hint-label">Scroll</span>
            </div>
            <div
              className={`task-queue-board-scroll-hint task-queue-board-scroll-hint-right${
                taskQueueBoardScrollState.canScrollRight ? "" : " is-hidden"
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
                <div
                  aria-hidden="true"
                  className="task-queue-board-load-sentinel"
                  ref={loadMoreRef}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
