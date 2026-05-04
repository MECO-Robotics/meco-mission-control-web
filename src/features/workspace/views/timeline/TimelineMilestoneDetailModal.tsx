import { useMemo } from "react";
import type { BootstrapPayload, MilestoneRecord } from "@/types";
import { groupTasksByPlanningState } from "@/features/workspace/shared/task/taskPlanning";
import { MilestonesEventDetailsModal } from "@/features/workspace/views/milestones/MilestonesEventDetailsModal";
import { MILESTONE_TASK_ORDER } from "@/features/workspace/views/milestones/sections/useMilestonesEventModalState";

interface TimelineMilestoneDetailModalProps {
  bootstrap: BootstrapPayload;
  milestone: MilestoneRecord | null;
  onClose: () => void;
  onEdit: (milestone: MilestoneRecord) => void;
  portalTarget: HTMLElement | null;
}

export function TimelineMilestoneDetailModal({
  bootstrap,
  milestone,
  onClose,
  onEdit,
  portalTarget,
}: TimelineMilestoneDetailModalProps) {
  const projectsById = useMemo(
    () =>
      Object.fromEntries(
        bootstrap.projects.map((project) => [project.id, project]),
      ) as Record<string, BootstrapPayload["projects"][number]>,
    [bootstrap.projects],
  );

  if (!portalTarget || !milestone) {
    return null;
  }

  const activeMilestoneTasks = bootstrap.tasks.filter(
    (task) => task.targetMilestoneId === milestone.id,
  );
  const activeMilestoneCompleteTasks = activeMilestoneTasks.filter(
    (task) => task.status === "complete",
  );
  const milestoneTaskGroups = groupTasksByPlanningState(
    activeMilestoneTasks.filter((task) => task.status !== "complete"),
    bootstrap,
  );

  return (
    <MilestonesEventDetailsModal
      activeMilestone={milestone}
      activeMilestoneCompleteTasks={activeMilestoneCompleteTasks}
      activeMilestoneTasks={activeMilestoneTasks}
      bootstrap={bootstrap}
      milestoneTaskGroups={milestoneTaskGroups}
      milestoneTaskOrder={MILESTONE_TASK_ORDER}
      modalPortalTarget={portalTarget}
      onClose={onClose}
      onEditMilestone={onEdit}
      projectsById={projectsById}
    />
  );
}
