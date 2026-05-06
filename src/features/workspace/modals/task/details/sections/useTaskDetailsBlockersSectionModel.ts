import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskBlockerType } from "@/types/common";
import type { TaskPayload } from "@/types/payloads";
import type { TaskBlockerDraft } from "@/types/payloads";
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
  const getBlockerKey = (blocker: { id?: string } | undefined, index: number) =>
    blocker?.id ?? `blocker-${index}`;
  const blockerDrafts = taskDraft?.taskBlockers ?? [];
  const openBlockers = getTaskOpenBlockersForTask(activeTaskId, bootstrap);
  const addBlockerDraft = (blockerType: TaskBlockerType, description: string) => {
    const blockerId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `blocker-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: [
        ...(current.taskBlockers ?? []),
        {
          id: blockerId,
          blockerType,
          blockerId: null,
          description,
          severity: "medium",
        },
      ],
    }));
  };
  const updateBlockerDraft = (blockerKey: string, updates: Partial<TaskBlockerDraft>) => {
    setTaskDraft?.((current) => {
      const nextBlockers = [...(current.taskBlockers ?? [])];
      const index = nextBlockers.findIndex(
        (blocker, currentIndex) => getBlockerKey(blocker, currentIndex) === blockerKey,
      );
      if (index < 0) {
        return current;
      }

      const existingBlocker = nextBlockers[index];

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
  const removeBlockerDraft = (blockerKey: string) => {
    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: (current.taskBlockers ?? []).filter(
        (blocker, currentIndex) => getBlockerKey(blocker, currentIndex) !== blockerKey,
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
