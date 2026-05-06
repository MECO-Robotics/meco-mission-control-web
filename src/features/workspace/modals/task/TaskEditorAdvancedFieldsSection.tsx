import type { Dispatch, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";

import { TaskEditorAdvancedMediaSection } from "./editorAdvanced/TaskEditorAdvancedMediaSection";
import { TaskEditorAdvancedProjectSection } from "./editorAdvanced/TaskEditorAdvancedProjectSection";
import { TaskEditorAdvancedTargetsSection } from "./editorAdvanced/TaskEditorAdvancedTargetsSection";
import { TaskEditorAdvancedTaskMetaSection } from "./editorAdvanced/TaskEditorAdvancedTaskMetaSection";
import { useTaskEditorAdvancedFieldsState } from "./editorAdvanced/useTaskEditorAdvancedFieldsState";

interface TaskEditorAdvancedFieldsSectionProps {
  activeTask: TaskRecord | null;
  bootstrap: BootstrapPayload;
  closeTaskModal: () => void;
  currentTaskId: string | null;
  isDeletingTask: boolean;
  isSavingTask: boolean;
  requestPhotoUpload: (projectId: string, file: File) => Promise<string>;
  setTaskDraft: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft: TaskPayload;
}

export function TaskEditorAdvancedFieldsSection({
  bootstrap,
  closeTaskModal,
  currentTaskId,
  isDeletingTask,
  isSavingTask,
  requestPhotoUpload,
  setTaskDraft,
  taskDraft,
}: TaskEditorAdvancedFieldsSectionProps) {
  const {
    availableDisciplines,
    getMechanismLabel,
    getPartInstanceLabel,
    getSubsystemLabel,
    handleProjectChange,
    primaryTargetNameOptions,
    projectMechanisms,
    projectPartInstances,
    selectedMechanismIds,
    selectedPartInstanceIds,
    selectedPrimaryTarget,
    selectedPrimaryTargetId,
    selectedPrimaryTargetIterations,
    selectedPrimaryTargetName,
    selectedScopeChips,
    subsystemsById,
    targetFallback,
    targetGroupLabel,
    taskPhotoProjectId,
    toggleTarget,
    updatePrimaryTarget,
    updatePrimaryTargetName,
  } = useTaskEditorAdvancedFieldsState({
    bootstrap,
    currentTaskId,
    setTaskDraft,
    taskDraft,
  });

  return (
    <details className="task-details-section-collapse modal-wide" open>
      <summary className="task-details-section-title task-details-section-summary">
        <span>Advanced</span>
      </summary>
      <div className="task-details-section-grid">
        <TaskEditorAdvancedMediaSection
          currentUrl={taskDraft.photoUrl}
          onChange={(value) => setTaskDraft((current) => ({ ...current, photoUrl: value }))}
          onUpload={async (file) => {
            if (!taskPhotoProjectId) {
              throw new Error("No project is available for photo upload.");
            }

            return requestPhotoUpload(taskPhotoProjectId, file);
          }}
        />
        <TaskEditorAdvancedProjectSection
          availableDisciplines={availableDisciplines}
          handleProjectChange={handleProjectChange}
          projectsById={Object.fromEntries(
            bootstrap.projects.map((project) => [project.id, project] as const),
          ) as Record<string, BootstrapPayload["projects"][number]>}
          setTaskDraft={setTaskDraft}
          taskDraft={taskDraft}
        />
        <TaskEditorAdvancedTargetsSection
          getMechanismLabel={getMechanismLabel}
          getPartInstanceLabel={getPartInstanceLabel}
          getSubsystemLabel={getSubsystemLabel}
          projectMechanisms={projectMechanisms}
          projectPartInstances={projectPartInstances}
          primaryTargetNameOptions={primaryTargetNameOptions}
          selectedMechanismIds={selectedMechanismIds}
          selectedPartInstanceIds={selectedPartInstanceIds}
          selectedPrimaryTarget={selectedPrimaryTarget}
          selectedPrimaryTargetId={selectedPrimaryTargetId}
          selectedPrimaryTargetIterations={selectedPrimaryTargetIterations}
          selectedPrimaryTargetName={selectedPrimaryTargetName}
          selectedScopeChips={selectedScopeChips}
          subsystemsById={subsystemsById}
          targetFallback={targetFallback}
          targetGroupLabel={targetGroupLabel}
          toggleTarget={toggleTarget}
          updatePrimaryTarget={updatePrimaryTarget}
          updatePrimaryTargetName={updatePrimaryTargetName}
        />
        <TaskEditorAdvancedTaskMetaSection
          bootstrap={bootstrap}
          closeTaskModal={closeTaskModal}
          isDeletingTask={isDeletingTask}
          isSavingTask={isSavingTask}
          setTaskDraft={setTaskDraft}
          taskDraft={taskDraft}
        />
      </div>
    </details>
  );
}
