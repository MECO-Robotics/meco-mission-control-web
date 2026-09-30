import { useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import { getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { useMilestoneEditor, type MilestoneEditorArgs } from "@/features/workspace/shared/milestones/useMilestoneEditor";
import { groupTasksByPlanningState } from "@/features/workspace/shared/task/taskPlanning";

export const MILESTONE_TASK_ORDER = [
  "blocked",
  "at-risk",
  "waiting-on-dependency",
  "ready",
  "overdue",
] as const;

type UseMilestonesMilestoneModalStateArgs = MilestoneEditorArgs & {
  bootstrap: BootstrapPayload;
  isAllProjectsView: boolean;
  projectFilter: FilterSelection;
};

export type MilestonesMilestoneModalState = ReturnType<typeof useMilestonesMilestoneModalState>;

export function useMilestonesMilestoneModalState({
  bootstrap,
  isAllProjectsView,
  projectFilter,
  ...editorArgs
}: UseMilestonesMilestoneModalStateArgs) {
  const editor = useMilestoneEditor({
    ...editorArgs,
    createProjectIds: isAllProjectsView && projectFilter.length > 0
      ? projectFilter : editorArgs.scopedProjectIds,
  });
  const { milestoneModalMode, activeMilestoneId } = editor;
  const activeMilestone =
    milestoneModalMode && activeMilestoneId
      ? bootstrap.milestones.find((milestone) => milestone.id === activeMilestoneId) ?? null
      : null;
  const activeMilestoneTasks = useMemo(
    () =>
      activeMilestone ? getMilestoneTasksForState(activeMilestone, bootstrap) : [],
    [activeMilestone, bootstrap],
  );
  const activeMilestoneCompleteTasks = useMemo(
    () => activeMilestoneTasks.filter((task) => task.status === "complete"),
    [activeMilestoneTasks],
  );
  const milestoneTaskGroups = useMemo(
    () =>
      groupTasksByPlanningState(
        activeMilestoneTasks.filter((task) => task.status !== "complete"),
        bootstrap,
      ),
    [activeMilestoneTasks, bootstrap],
  );

  const modalPortalTarget =
    typeof document !== "undefined"
      ? ((document.querySelector(".page-shell") as HTMLElement | null) ?? document.body)
      : null;

  return {
    ...editor,
    openCreateMilestoneModal: () => editor.openCreateMilestoneModalForDay(),
    activeMilestone,
    activeMilestoneCompleteTasks,
    activeMilestoneTasks,
    milestoneTaskGroups,
    milestoneTaskOrder: MILESTONE_TASK_ORDER,
    modalPortalTarget,
  };
}
