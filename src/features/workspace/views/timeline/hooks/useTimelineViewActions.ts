import { useCallback } from "react";
import type { TaskRecord } from "@/types/recordsExecution";
import type { TimelineViewInterval } from "@/features/workspace/shared/timeline/timelineDateUtils";

type TimelineGridMotion = "left" | "right" | "neutral";

interface UseTimelineViewActionsArgs {
  openTaskDetailModal: (task: TaskRecord) => void;
  openMilestoneModalForDay: (day: string) => void;
  playTimelineGridAnimation: (direction: TimelineGridMotion) => void;
  setSelectedSubsystemId: (value: string | null) => void;
  setSelectedTaskId: (value: string | null) => void;
  setViewAnchorDate: (value: string) => void;
  setViewInterval: (value: TimelineViewInterval) => void;
  viewInterval: TimelineViewInterval;
}

export function useTimelineViewActions({
  openTaskDetailModal,
  openMilestoneModalForDay,
  playTimelineGridAnimation,
  setSelectedSubsystemId,
  setSelectedTaskId,
  setViewAnchorDate,
  setViewInterval,
  viewInterval,
}: UseTimelineViewActionsArgs) {
  const handleTimelineHeaderDayClick = useCallback(
    (day: string) => {
      if (viewInterval !== "week") {
        playTimelineGridAnimation("neutral");
        setViewInterval("week");
        setViewAnchorDate(day);
        return;
      }

      openMilestoneModalForDay(day);
    },
    [openMilestoneModalForDay, playTimelineGridAnimation, setViewAnchorDate, setViewInterval, viewInterval],
  );

  const openTaskDetailAndSelectTask = useCallback(
    (task: TaskRecord) => {
      setSelectedSubsystemId(null);
      setSelectedTaskId(task.id);
      openTaskDetailModal(task);
    },
    [openTaskDetailModal, setSelectedSubsystemId, setSelectedTaskId],
  );

  return { handleTimelineHeaderDayClick, openTaskDetailAndSelectTask };
}
