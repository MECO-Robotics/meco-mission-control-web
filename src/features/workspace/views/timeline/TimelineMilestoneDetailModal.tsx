import { useMemo } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import { MilestonesEventDetailsModal } from "@/features/workspace/views/milestones/MilestonesEventDetailsModal";

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

  return (
    <MilestonesEventDetailsModal
      activeMilestone={milestone}
      bootstrap={bootstrap}
      milestoneModalMode="detail"
      modalPortalTarget={portalTarget}
      onCancelEdit={onClose}
      onClose={onClose}
      onEditMilestone={onEdit}
      projectsById={projectsById}
    />
  );
}
