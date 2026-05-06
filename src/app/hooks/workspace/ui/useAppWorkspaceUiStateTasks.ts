import { useState } from "react";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { buildEmptyTaskPayload } from "@/lib/appUtils/taskTargets";
import type { TaskPayload } from "@/types/payloads";
import type { TaskModalMode } from "@/features/workspace/shared/model/workspaceModalModes";

export function useAppWorkspaceUiStateTasks() {
  const [taskModalMode, setTaskModalMode] = useState<TaskModalMode>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTimelineTaskDetailId, setActiveTimelineTaskDetailId] = useState<string | null>(
    null,
  );
  const [taskDraft, setTaskDraft] = useState<TaskPayload>(
    buildEmptyTaskPayload(EMPTY_BOOTSTRAP),
  );
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [showTimelineCreateToggleInTaskModal, setShowTimelineCreateToggleInTaskModal] =
    useState(false);
  const [timelineMilestoneCreateSignal, setTimelineMilestoneCreateSignal] = useState(0);

  return {
    activeTaskId,
    activeTimelineTaskDetailId,
    isDeletingTask,
    isSavingTask,
    setActiveTaskId,
    setActiveTimelineTaskDetailId,
    setIsDeletingTask,
    setIsSavingTask,
    setShowTimelineCreateToggleInTaskModal,
    setTaskDraft,
    setTaskModalMode,
    setTimelineMilestoneCreateSignal,
    showTimelineCreateToggleInTaskModal,
    taskDraft,
    taskModalMode,
    timelineMilestoneCreateSignal,
  };
}
