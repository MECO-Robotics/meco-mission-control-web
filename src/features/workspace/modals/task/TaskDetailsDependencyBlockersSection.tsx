import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskDetailsDependenciesSection } from "./TaskDetailsDependenciesSection";

interface TaskDetailsDependencyBlockersSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  dependencyTargetProjectId?: string | null;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsDependencyBlockersSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  dependencyTargetProjectId,
  setTaskDraft,
  taskDraft,
}: TaskDetailsDependencyBlockersSectionProps) {
  const taskRisks = bootstrap.risks.filter((risk) => risk.relatedTargets.some(
    (target) => target.kind === "task" && target.id === activeTask.id,
  ));

  return (
    <div className="field modal-wide task-detail-list-shell">
      <TaskDetailsDependenciesSection
        activeTask={activeTask}
        bootstrap={bootstrap}
        canInlineEdit={canInlineEdit}
        collapsibleOpen
        targetProjectId={dependencyTargetProjectId}
        onCollapsibleToggle={() => undefined}
        taskDraft={taskDraft}
        setTaskDraft={setTaskDraft}
      />
      <section aria-label="Risks affecting this task" className="task-details-risk-links">
        <h4>Risks affecting this task</h4>
        {taskRisks.length ? (
          <ul>{taskRisks.map((risk) => (
            <li key={risk.id}><strong>{risk.title}</strong> · {risk.severity} · {risk.status}</li>
          ))}</ul>
        ) : <p>No linked risks.</p>}
      </section>
    </div>
  );
}
