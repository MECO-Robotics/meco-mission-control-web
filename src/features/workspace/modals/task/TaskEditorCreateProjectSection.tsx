import type { Dispatch, SetStateAction } from "react";

import { IconTasks } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";

import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import { useTaskEditorAdvancedFieldsState } from "./editorAdvanced/useTaskEditorAdvancedFieldsState";

interface TaskEditorCreateProjectSectionProps {
  bootstrap: BootstrapPayload;
  currentTaskId: string | null;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorCreateProjectSection({
  bootstrap,
  currentTaskId,
  setTaskDraft,
  taskDraft,
}: TaskEditorCreateProjectSectionProps) {
  const { handleProjectChange } = useTaskEditorAdvancedFieldsState({
    bootstrap,
    currentTaskId,
    setTaskDraft,
    taskDraft,
  });
  const projectOptions = bootstrap.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  return (
    <div className="task-details-section-grid modal-wide">
      <label className="field task-detail-row task-detail-row-chip">
        <span style={{ color: "var(--text-title)" }}>Project</span>
        <FilterDropdown
          allLabel="Choose project"
          ariaLabel="Set project"
          buttonInlineEditField="project"
          className="task-queue-filter-menu-submenu"
          icon={<IconTasks />}
          singleSelect
          onChange={(selection) => {
            const projectId = selection[0];

            if (!projectId) {
              return;
            }

            handleProjectChange(projectId);
          }}
          options={projectOptions}
          value={taskDraft.projectId ? [taskDraft.projectId] : []}
        />
      </label>
    </div>
  );
}
