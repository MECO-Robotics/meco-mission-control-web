import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload } from "@/types";
import type { TaskBlockerDraft } from "@/types";
import { getTaskOpenBlockersForTask } from "../../../../shared/task/taskTargeting";

interface UseTaskDetailsBlockersSectionModelArgs {
  activeTaskId: string;
  bootstrap: BootstrapPayload;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function useTaskDetailsBlockersSectionModel({
  activeTaskId,
  bootstrap,
  onResolveTaskBlocker,
  setTaskDraft,
  taskDraft,
}: UseTaskDetailsBlockersSectionModelArgs) {
  const blockerDrafts = taskDraft?.taskBlockers ?? [];
  const openBlockers = getTaskOpenBlockersForTask(activeTaskId, bootstrap);
  const addBlockerDraft = () => {
    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: [
        ...(current.taskBlockers ?? []),
        {
          blockerType: "external",
          blockerId: null,
          description: "",
          severity: "medium",
        },
      ],
    }));
  };
  const updateBlockerDraft = (index: number, updates: Partial<TaskBlockerDraft>) => {
    setTaskDraft?.((current) => {
      const nextBlockers = [...(current.taskBlockers ?? [])];
      const existingBlocker = nextBlockers[index];
      if (!existingBlocker) {
        return current;
      }

      nextBlockers[index] = {
        ...existingBlocker,
        ...updates,
      };

      return {
        ...current,
        taskBlockers: nextBlockers,
      };
    });
  };
  const removeBlockerDraft = (index: number) => {
    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: (current.taskBlockers ?? []).filter(
        (_blocker, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  return {
    addBlockerDraft,
    blockerDrafts,
    openBlockers,
    onResolveTaskBlocker,
    removeBlockerDraft,
    updateBlockerDraft,
  };
}
