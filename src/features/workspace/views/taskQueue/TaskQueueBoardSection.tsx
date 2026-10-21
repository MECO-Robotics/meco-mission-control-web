import { useCallback, useRef } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskStatus } from "@/types/common";
import type { OpenEditTaskModalOptions } from "@/types/taskEditIntent";
import type { TaskRecord } from "@/types/recordsExecution";
import { KanbanScrollFrame } from "../kanban/KanbanScrollFrame";
import { TaskQueueKanbanBoard } from "./TaskQueueKanbanBoard";
import {
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
  workTypesById: Record<string, BootstrapPayload["workTypes"][number]>;
  focusedBoardState: TaskQueueBoardState | null;
  membersById: Record<string, BootstrapPayload["members"][number]>;
  openEditTaskModal: (task: TaskRecord, options?: OpenEditTaskModalOptions) => void;
  onReassignTaskStatus?: (task: TaskRecord, status: TaskStatus) => void | Promise<void>;
  processedTasks: TaskRecord[];
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  setFocusedBoardState: Dispatch<SetStateAction<TaskQueueBoardState | null>>;
  setTaskQueueZoom: Dispatch<SetStateAction<number>>;
  showProjectContextOnCards: boolean;
  showProjectOnCards: boolean;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
  taskFilterMotionClass: string;
  taskQueueZoom: number;
  workstreamsById: Record<string, BootstrapPayload["workstreams"][number]>;
}

export function TaskQueueBoardSection({
  bootstrap,
  workTypesById,
  focusedBoardState,
  membersById,
  openEditTaskModal,
  onReassignTaskStatus,
  processedTasks,
  projectsById,
  setFocusedBoardState,
  setTaskQueueZoom,
  showProjectContextOnCards,
  showProjectOnCards,
  subsystemsById,
  taskFilterMotionClass,
  taskQueueZoom,
  workstreamsById,
}: TaskQueueBoardSectionProps) {
  const taskQueueBoardShellRef = useRef<HTMLDivElement>(null);
  const zoomBoard = useCallback(
    (direction: 1 | -1) => {
      setTaskQueueZoom((current) => clampTaskQueueZoom(current + direction * TASK_QUEUE_ZOOM_STEP));
    },
    [setTaskQueueZoom],
  );
  const isFocused = focusedBoardState !== null;
  const isCompactZoom = shouldHideTaskQueueSummary(taskQueueZoom);
  const boardStyle = {
    "--task-queue-zoom": taskQueueZoom,
    "--task-queue-board-column-width": `calc(15.5rem * ${taskQueueZoom})`,
    "--task-queue-board-focused-card-width": `calc(16rem * ${taskQueueZoom})`,
  } as CSSProperties;

  useTaskQueueBoardZoomInput(taskQueueBoardShellRef, zoomBoard);

  return (
    <KanbanScrollFrame
      motionClassName={taskFilterMotionClass}
      isFocused={isFocused}
      isCompact={isCompactZoom}
      shellRef={taskQueueBoardShellRef}
      style={boardStyle}
    >
      {processedTasks.length > 0 ? (
        <TaskQueueKanbanBoard
          bootstrap={bootstrap}
          workTypesById={workTypesById}
          focusedState={focusedBoardState}
          membersById={membersById}
          openEditTaskModal={openEditTaskModal}
          projectsById={projectsById}
          taskQueueZoom={taskQueueZoom}
          showProjectContextOnCards={showProjectContextOnCards}
          showProjectOnCards={showProjectOnCards}
          onClearFocus={() => setFocusedBoardState(null)}
          onFocusState={setFocusedBoardState}
          onReassignTaskStatus={onReassignTaskStatus}
          subsystemsById={subsystemsById}
          tasks={processedTasks}
          workstreamsById={workstreamsById}
        />
      ) : (
        <p className="empty-state">No tasks match the current filters.</p>
      )}

    </KanbanScrollFrame>
  );
}
