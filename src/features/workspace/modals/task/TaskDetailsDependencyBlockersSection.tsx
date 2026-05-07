import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
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
  const [sharedCollapsibleOpen, setSharedCollapsibleOpen] = useState(true);

  useEffect(() => {
    setSharedCollapsibleOpen(true);
  }, [activeTask.id]);

  return (
    <div className="field modal-wide task-detail-list-shell">
      <div className="task-details-dependency-blocker-grid">
        <TaskDetailsDependenciesSection
          activeTask={activeTask}
          bootstrap={bootstrap}
          canInlineEdit={canInlineEdit}
          collapsibleOpen={sharedCollapsibleOpen}
          onCollapsibleToggle={setSharedCollapsibleOpen}
          taskDraft={taskDraft}
          setTaskDraft={setTaskDraft}
        />
        <TaskDetailsBlockersSection
          activeTaskId={activeTask.id}
          bootstrap={bootstrap}
          canInlineEdit={canInlineEdit}
          collapsibleOpen={sharedCollapsibleOpen}
          onCollapsibleToggle={setSharedCollapsibleOpen}
          onResolveTaskBlocker={onResolveTaskBlocker}
          setTaskDraft={setTaskDraft}
          taskDraft={taskDraft}
        />
      </div>
    </div>
  );
}
