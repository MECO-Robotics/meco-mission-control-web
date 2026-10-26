import { useMemo, useRef, useState, type ReactNode } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskWorkflowStatus } from "@/types/common";
import type { OpenEditTaskModalOptions, TaskEditIntentState } from "@/types/taskEditIntent";
import type { TaskRecord } from "@/types/recordsExecution";

import { ModalDialog } from "@/components/ModalDialog";
import { getStatusPillClassName } from "@/features/workspace/shared/model/workspaceUtils";
import { KanbanProjectGroup } from "@/features/workspace/views/kanban/KanbanProjectGroup";
import { KanbanSwimlane } from "@/features/workspace/views/kanban/KanbanSwimlane";
import { KanbanColumns } from "@/features/workspace/views/kanban/KanbanColumns";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";
import {
  TASK_QUEUE_BOARD_COLUMNS,
  formatTaskQueueBoardState,
  getTaskQueueBoardState,
  groupTasksByBoardState,
  type TaskQueueBoardState,
} from "./taskQueueKanbanBoardState";
import { TaskQueueCard } from "./state/taskQueueKanbanCardView";
import { groupTaskQueueSwimlanes, type TaskQueueGroupBy } from "./taskQueueSwimlanes";
import { TaskQueueSwimlaneLabel } from "./taskQueueSwimlaneLabel";
import { getProjectIconColor } from "@/components/layout/sidebarProjectIcons";

const TASK_QUEUE_TASKS_PREVIEW_LIMIT = 5;

const TASK_QUEUE_BOARD_STATE_LOGO_SPECS: Record<
  TaskQueueBoardState,
  { signal: TimelineTaskStatusSignal; status: TaskRecord["status"] }
> = {
  unrecorded: { signal: "unrecorded", status: "unrecorded" },
  "not-started": { signal: "not-started", status: "not-started" },
  "in-progress": { signal: "in-progress", status: "in-progress" },
  blocked: { signal: "blocked", status: "not-started" },
  "waiting-on-dependency": { signal: "waiting-on-dependency", status: "not-started" },
  "waiting-for-qa": { signal: "waiting-for-qa", status: "waiting-for-qa" },
  complete: { signal: "complete", status: "complete" },
};

const TASK_QUEUE_DIRECT_STATUS_STATES: readonly TaskWorkflowStatus[] = [
  "not-started",
  "in-progress",
  "waiting-for-qa",
  "complete",
];

function isTaskQueueDirectStatusState(state: TaskQueueBoardState): state is TaskWorkflowStatus {
  return TASK_QUEUE_DIRECT_STATUS_STATES.includes(state as TaskWorkflowStatus);
}

function isTaskQueueEditIntentState(state: TaskQueueBoardState): state is TaskEditIntentState {
  return state === "blocked" || state === "waiting-on-dependency";
}

interface TaskQueueKanbanBoardProps {
  groupBy: TaskQueueGroupBy;
  bootstrap: BootstrapPayload;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord, options?: OpenEditTaskModalOptions) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  tasks: TaskRecord[];
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
  focusedState: TaskQueueBoardState | null;
  onClearFocus: () => void;
  onFocusState: (state: TaskQueueBoardState) => void;
  onReassignTaskStatus?: (task: TaskRecord, status: TaskWorkflowStatus) => void | Promise<void>;
}

export function TaskQueueKanbanBoard({
  groupBy,
  tasks,
  focusedState,
  onClearFocus,
  onFocusState,
  onReassignTaskStatus,
  ...cardProps
}: TaskQueueKanbanBoardProps) {
  const pendingTaskStatusDropIdsRef = useRef<Set<string>>(new Set());
  const [pendingTaskStatusDropIds, setPendingTaskStatusDropIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [tasksDialog, setTasksDialog] = useState<{
    laneLabel: string;
    state: TaskQueueBoardState;
    tasks: TaskRecord[];
  } | null>(null);
  const tasksByState = useMemo(
    () => groupTasksByBoardState(tasks, cardProps.bootstrap),
    [cardProps.bootstrap, tasks],
  );

  const focusedTasks = useMemo(
    () => (focusedState === null ? [] : tasksByState[focusedState]),
    [focusedState, tasksByState],
  );

  const swimlanes = useMemo(
    () => groupTaskQueueSwimlanes(focusedState === null ? tasks : focusedTasks, cardProps.bootstrap, groupBy),
    [cardProps.bootstrap, focusedState, focusedTasks, groupBy, tasks],
  );
  const boardSwimlanes = useMemo(
    () => swimlanes.map((project) => ({
      id: project.id,
      label: project.projectName,
      accentColor: getProjectIconColor(cardProps.projectsById[project.id] ?? null),
      lanes: project.lanes.map((lane) => {
        const itemsByState = groupTasksByBoardState(lane.tasks, cardProps.bootstrap);
        const visibleItemsByState: Record<TaskQueueBoardState, TaskRecord[]> = { ...itemsByState };
        const footerByState: Partial<Record<TaskQueueBoardState, ReactNode>> = {};

        for (const { state } of TASK_QUEUE_BOARD_COLUMNS) {
          const stateTasks = itemsByState[state];
          visibleItemsByState[state] = stateTasks.slice(0, TASK_QUEUE_TASKS_PREVIEW_LIMIT);
          if (stateTasks.length <= TASK_QUEUE_TASKS_PREVIEW_LIMIT) continue;

          footerByState[state] = (
            <button
              aria-label={`Show all ${stateTasks.length} ${formatTaskQueueBoardState(state).toLowerCase()} tasks in ${project.projectName}, ${lane.label.name}`}
              className="secondary-action task-queue-board-show-more"
              onClick={(event) => {
                event.stopPropagation();
                setTasksDialog({
                  laneLabel: `${project.projectName} · ${lane.label.name}`,
                  state,
                  tasks: stateTasks,
                });
              }}
              type="button"
            >
              Show more
            </button>
          );
        }

        return {
          id: lane.id,
          header: <TaskQueueSwimlaneLabel {...lane.label} />,
          itemsByState,
          visibleItemsByState,
          footerByState,
        };
      }),
    })),
    [cardProps.bootstrap, cardProps.projectsById, swimlanes],
  );
  const boardColumns = useMemo(
    () =>
      TASK_QUEUE_BOARD_COLUMNS.map(({ state }) => ({
        state,
        count: tasksByState[state].length,
        header: (
          <span className="task-queue-board-state-label">
            <span aria-hidden="true" className="task-queue-board-column-header-icon">
              <TimelineTaskStatusLogo
                compact
                signal={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[state].signal}
                status={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[state].status}
              />
            </span>
            <span className="task-queue-board-column-header-label">
              {formatTaskQueueBoardState(state)}
            </span>
          </span>
        ),
      })),
    [tasksByState],
  );
  const tasksDialogTitle = tasksDialog
    ? `${formatTaskQueueBoardState(tasksDialog.state)} tasks · ${tasksDialog.laneLabel}`
    : "";
  const tasksDialogView = tasksDialog ? (
    <ModalDialog
      label={tasksDialogTitle}
      onClose={() => setTasksDialog(null)}
      dismissOnBackdrop
    >
      <section className="modal-card modal-panel-surface task-queue-completed-dialog">
        <div className="panel-header compact-header">
          <div>
            <h2>{tasksDialogTitle}</h2>
            <span>{tasksDialog.tasks.length} tasks</span>
          </div>
          <button
            aria-label="Close completed tasks"
            className="icon-button"
            onClick={() => setTasksDialog(null)}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="task-queue-completed-dialog-list">
          {tasksDialog.tasks.map((task) => (
            <TaskQueueCard
              {...cardProps}
              key={task.id}
              task={task}
              openEditTaskModal={(selectedTask, options) => {
                setTasksDialog(null);
                cardProps.openEditTaskModal(selectedTask, options);
              }}
            />
          ))}
        </div>
      </section>
    </ModalDialog>
  ) : null;

  const setTaskStatusDropPending = (taskId: string, isPending: boolean) => {
    const nextPendingIds = new Set(pendingTaskStatusDropIdsRef.current);
    if (isPending) {
      nextPendingIds.add(taskId);
    } else {
      nextPendingIds.delete(taskId);
    }

    pendingTaskStatusDropIdsRef.current = nextPendingIds;
    setPendingTaskStatusDropIds(nextPendingIds);
  };

  const runTaskStatusDrop = async (task: TaskRecord, state: TaskWorkflowStatus) => {
    if (!onReassignTaskStatus || pendingTaskStatusDropIdsRef.current.has(task.id)) {
      return;
    }

    setTaskStatusDropPending(task.id, true);
    try {
      await onReassignTaskStatus(task, state);
    } finally {
      setTaskStatusDropPending(task.id, false);
    }
  };

  if (focusedState !== null) {
    return (
      <section className="task-queue-board-focused" data-board-state={focusedState}>
        <div className="task-queue-board-focused-shell">
          <header className="task-queue-board-focused-header">
            <div className="task-queue-board-focused-title-stack">
              <h3 className="task-queue-board-focused-title">
                <span className={getStatusPillClassName(focusedState)}>
                  <span aria-hidden="true" className="task-queue-board-focused-title-icon">
                    <TimelineTaskStatusLogo
                      compact
                      signal={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[focusedState].signal}
                      status={TASK_QUEUE_BOARD_STATE_LOGO_SPECS[focusedState].status}
                    />
                  </span>
                  <span className="task-queue-board-focused-title-label">
                    {formatTaskQueueBoardState(focusedState)}
                  </span>
                </span>
              </h3>
              <span className="task-queue-board-focused-count">{focusedTasks.length}</span>
            </div>
            <button
              aria-label="Exit focused column view"
              className="task-queue-board-focused-exit"
              onClick={onClearFocus}
              type="button"
            >
              {"\u00d7"}
            </button>
          </header>

          <div className="task-queue-board-focused-groups">
            {swimlanes.length > 0 ? (
              swimlanes.map((project) => (
                <KanbanProjectGroup key={project.id} label={project.projectName} accentColor={getProjectIconColor(cardProps.projectsById[project.id] ?? null)}>
                  {project.lanes.map((lane) => (
                    <KanbanSwimlane
                      header={<TaskQueueSwimlaneLabel {...lane.label} />}
                      key={lane.id}
                    >
                      <span className="task-queue-board-column-count kanban-swimlane-cell-count">{lane.tasks.length}</span>
                      <div className="task-queue-board-focused-lane-grid">
                        {lane.tasks.slice(0, TASK_QUEUE_TASKS_PREVIEW_LIMIT).map((task) => (
                          <TaskQueueCard {...cardProps} key={task.id} task={task} />
                        ))}
                      </div>
                      {lane.tasks.length > TASK_QUEUE_TASKS_PREVIEW_LIMIT ? (
                        <button
                          aria-label={`Show all ${lane.tasks.length} ${formatTaskQueueBoardState(focusedState).toLowerCase()} tasks in ${project.projectName}, ${lane.label.name}`}
                          className="secondary-action task-queue-board-show-more"
                          onClick={() => setTasksDialog({
                            laneLabel: `${project.projectName} · ${lane.label.name}`,
                            state: focusedState,
                            tasks: lane.tasks,
                          })}
                          type="button"
                        >
                          Show more
                        </button>
                      ) : null}
                    </KanbanSwimlane>
                  ))}
                </KanbanProjectGroup>
              ))
            ) : (
              <p className="empty-state">No tasks match the current filters.</p>
            )}
          </div>
        </div>
        {tasksDialogView}
      </section>
    );
  }

  return (
    <>
    <KanbanColumns
      boardClassName="task-queue-board"
      canDragItem={(task) => !pendingTaskStatusDropIds.has(task.id)}
      canDropItem={(task, state, sourceState) => {
        if (state === "unrecorded") return false;
        if (pendingTaskStatusDropIds.has(task.id)) {
          return false;
        }

        if (isTaskQueueDirectStatusState(state)) {
          return (
            isTaskQueueDirectStatusState(sourceState) &&
            Boolean(onReassignTaskStatus) &&
            task.status !== state
          );
        }

        return getTaskQueueBoardState(task, cardProps.bootstrap) !== state;
      }}
      canDropState={() => true}
      columnBodyClassName="task-queue-board-column-body"
      columnClassName="task-queue-board-column"
      columnEmptyClassName="task-queue-board-column-empty"
      columnCountClassName="task-queue-board-column-count"
      columnHeaderClassName="task-queue-board-column-header"
      columns={boardColumns}
      emptyLabel="No tasks"
      getItemDragLabel={(task) => task.title}
      getItemId={(task) => task.id}
      itemsByState={tasksByState}
      swimlaneGroups={boardSwimlanes}
      onColumnBodyClick={onFocusState}
      onItemDrop={(task, state) => {
        if (isTaskQueueDirectStatusState(state)) {
          return runTaskStatusDrop(task, state);
        }

        if (isTaskQueueEditIntentState(state)) {
          cardProps.openEditTaskModal(task, { intentState: state });
        }
      }}
      renderItem={(task, _, dragProps) => (
        <TaskQueueCard
          {...dragProps}
          {...cardProps}
          key={task.id}
          task={task}
        />
      )}
    />
    {tasksDialogView}
    </>
  );
}
