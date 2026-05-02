import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { TaskDetailsBlockersSection } from "./TaskDetailsBlockersSection";
import { TaskDetailsDependenciesSection } from "./TaskDetailsDependenciesSection";

interface TaskDetailsDependencyBlockersSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsDependencyBlockersSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  onResolveTaskBlocker,
  setTaskDraft,
  taskDraft,
}: TaskDetailsDependencyBlockersSectionProps) {
  return (
    <div className="field modal-wide task-detail-list-shell task-detail-collapsible-field">
      <details className="task-detail-collapsible" open>
        <summary className="task-detail-collapsible-summary">
          <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
          <span className="task-detail-copy">Dependencies & Blockers</span>
        </summary>
        <div className="task-detail-collapsible-body">
          <div className="task-details-dependency-blocker-grid">
            <TaskDetailsDependenciesSection
              activeTask={activeTask}
              bootstrap={bootstrap}
              canInlineEdit={canInlineEdit}
              taskDraft={taskDraft}
            />
            <TaskDetailsBlockersSection
              activeTaskId={activeTask.id}
              bootstrap={bootstrap}
              canInlineEdit={canInlineEdit}
              onResolveTaskBlocker={onResolveTaskBlocker}
              setTaskDraft={setTaskDraft}
              taskDraft={taskDraft}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
