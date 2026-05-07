import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TaskDetailsEditableField } from "./taskModalTypes";
import { TaskDetailsAdvancedSectionContent } from "./details/TaskDetailsAdvancedSectionContent";

interface TaskDetailsAdvancedSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  advancedSectionOpen: boolean;
  canInlineEdit: boolean;
  editingField: TaskDetailsEditableField | null;
  openTaskEditModal: () => void;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsAdvancedSection({
  activeTask,
  bootstrap,
  advancedSectionOpen,
  canInlineEdit,
  editingField,
  openTaskEditModal,
  setAdvancedSectionOpen,
  setEditingField,
  setTaskDraft,
  taskDraft,
}: TaskDetailsAdvancedSectionProps) {
  return (
    <TaskDetailsAdvancedSectionContent
      activeTask={activeTask}
      bootstrap={bootstrap}
      advancedSectionOpen={advancedSectionOpen}
      canInlineEdit={canInlineEdit}
      editingField={editingField}
      openTaskEditModal={openTaskEditModal}
      setAdvancedSectionOpen={setAdvancedSectionOpen}
      setEditingField={setEditingField}
      setTaskDraft={setTaskDraft}
      taskDraft={taskDraft}
    />
  );
}
