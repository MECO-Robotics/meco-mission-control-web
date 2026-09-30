import type { Dispatch, SetStateAction } from "react";

import { IconTasks } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads/task";

import { FilterDropdown } from "../../shared/filters/FilterDropdown";
import { useTaskEditorAdvancedFieldsState } from "./editorAdvanced/useTaskEditorAdvancedFieldsState";

interface TaskEditorCreateProjectSectionProps {
  bootstrap: BootstrapPayload;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorCreateProjectSection({
  bootstrap,
  setTaskDraft,
  taskDraft,
}: TaskEditorCreateProjectSectionProps) {
  const { handleProjectChange } = useTaskEditorAdvancedFieldsState({
    bootstrap,
    setTaskDraft,
    taskDraft,
  });
  const projectOptions = bootstrap.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
  const selectedProject = bootstrap.projects.find(({ id }) => id === taskDraft.projectId);
  const workTypeOptions = bootstrap.workTypes.filter((workType) =>
    workType.isActive && workType.projectType === selectedProject?.projectType,
  );
  const responsibleGroups = bootstrap.responsibleGroups.filter((group) =>
    !group.isArchived && group.seasonId === selectedProject?.seasonId &&
    (group.projectIds.length === 0 || group.projectIds.includes(taskDraft.projectId)),
  );

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
      <label className="field task-detail-row task-detail-row-chip">
        <span style={{ color: "var(--text-title)" }}>Work type</span>
        <select
          onChange={(event) => setTaskDraft((current) => ({ ...current, workTypeId: event.target.value }))}
          value={taskDraft.workTypeId}
        >
          {workTypeOptions.map((workType) => <option key={workType.id} value={workType.id}>{workType.name}</option>)}
        </select>
      </label>
      <label className="field task-detail-row task-detail-row-chip">
        <span style={{ color: "var(--text-title)" }}>Responsible group</span>
        <select
          onChange={(event) => setTaskDraft((current) => ({ ...current, responsibleGroupId: event.target.value || null }))}
          value={taskDraft.responsibleGroupId ?? ""}
        >
          <option value="">Unassigned group</option>
          {responsibleGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
      </label>
    </div>
  );
}
