import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestonePayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { TaskCalendarView } from "@/features/workspace/views/taskCalendar/TaskCalendarView";

interface TaskCalendarPlaceholderViewProps {
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  onDeleteTimelineMilestone: (milestoneId: string) => Promise<void>;
  onSaveTimelineMilestone: (
    mode: "create" | "edit",
    milestoneId: string | null,
    payload: MilestonePayload,
  ) => Promise<void>;
  onTaskDetailOpen: (task: TaskRecord) => void;
  onTaskEditCanceled?: () => void;
  onTaskEditSaved?: () => void;
}

export function TaskCalendarPlaceholderView(props: TaskCalendarPlaceholderViewProps) {
  return <TaskCalendarView {...props} />;
}
