import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import { TaskDetailsBlockersSectionView } from "./sections/TaskDetailsBlockersSectionView";

interface TaskDetailsBlockersSectionProps {
  activeTaskId: string;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsBlockersSectionContent(props: TaskDetailsBlockersSectionProps) {
  return <TaskDetailsBlockersSectionView {...props} />;
}
