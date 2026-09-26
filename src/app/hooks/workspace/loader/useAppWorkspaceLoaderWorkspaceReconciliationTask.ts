import type { BootstrapPayload } from "@/types/bootstrap";
import type { AppWorkspaceState } from "@/app/hooks/useAppWorkspaceState";
import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";

export function reconcileTaskModal(
  state: AppWorkspaceState,
  scopedPayload: BootstrapPayload,
  payload: BootstrapPayload,
) {
  if (state.taskModalMode === "create") {
    state.setTaskDraft(buildEmptyTaskPayload(scopedPayload));
  }

  if (state.taskModalMode === "edit" && state.activeTaskId) {
    const nextTask = payload.tasks.find((task) => task.id === state.activeTaskId);
    if (nextTask) {
      state.setTaskDraft(taskToPayload(nextTask, scopedPayload));
    } else {
      state.setTaskModalMode(null);
      state.setActiveTaskId(null);
    }
  }
}
