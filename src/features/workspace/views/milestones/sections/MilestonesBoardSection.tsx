import { KanbanScrollFrame } from "@/features/workspace/views/kanban/KanbanScrollFrame";
import type { BootstrapPayload, MilestoneRecord } from "@/types";

import { MilestoneKanbanBoard } from "../MilestoneKanbanBoard";

interface MilestonesBoardSectionProps {
  milestones: MilestoneRecord[];
  motionClassName: string;
  onOpenMilestone: (milestone: MilestoneRecord) => void;
  projectLabelByMilestoneId: Record<string, string>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export function MilestonesBoardSection({
  milestones,
  motionClassName,
  onOpenMilestone,
  projectLabelByMilestoneId,
  subsystemsById,
}: MilestonesBoardSectionProps) {
  return milestones.length > 0 ? (
    <KanbanScrollFrame motionClassName={motionClassName}>
      <MilestoneKanbanBoard
        milestones={milestones}
        onOpenMilestone={onOpenMilestone}
        projectLabelByMilestoneId={projectLabelByMilestoneId}
        subsystemsById={subsystemsById}
      />
    </KanbanScrollFrame>
  ) : (
    <p className="empty-state">No milestones match the current filters.</p>
  );
}
