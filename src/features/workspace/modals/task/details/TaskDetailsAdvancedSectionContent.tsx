import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TaskDetailsEditableField } from "../taskModalTypes";
import { TaskDetailsAdvancedSectionView } from "./sections/TaskDetailsAdvancedSectionView";

interface TaskDetailsAdvancedSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  advancedSectionOpen: boolean;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
  editingField: TaskDetailsEditableField | null;
  openTaskEditModal: () => void;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsAdvancedSectionContent(props: TaskDetailsAdvancedSectionProps) {
  return <TaskDetailsAdvancedSectionView {...props} />;
}
