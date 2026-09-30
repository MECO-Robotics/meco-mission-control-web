import type { BootstrapPayload } from "@/types/bootstrap";
import { MilestonesMilestoneModal } from "../milestones/MilestonesEventModal";
import type { useTimelineMilestoneModal } from "./useTimelineEventModal";

type TimelineMilestoneModalState = ReturnType<typeof useTimelineMilestoneModal>;

export function TimelineMilestoneModal({
  bootstrap,
  modalPortalTarget,
  modal,
  onCreateMilestoneReport,
  projectsById,
}: {
  bootstrap: BootstrapPayload;
  modalPortalTarget: HTMLElement | null;
  modal: TimelineMilestoneModalState;
  onCreateMilestoneReport?: (milestoneId: string, onReturn?: () => void) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}) {
  const activeMilestone = bootstrap.milestones.find(
    (milestone) => milestone.id === (modal.activeMilestoneDetail?.id ?? modal.activeMilestoneId),
  ) ?? null;

  return (
    <MilestonesMilestoneModal
      activeMilestone={activeMilestone}
      projectsById={projectsById}
      onEditMilestone={modal.openEditMilestoneModalForMilestone}
      onRecordResult={onCreateMilestoneReport ? (milestone) => {
        modal.closeMilestoneDetailModal();
        onCreateMilestoneReport(milestone.id, () => modal.openMilestoneDetailModalForMilestone(milestone));
      } : undefined}
      bootstrap={bootstrap}
      milestoneDraft={modal.milestoneDraft}
      milestoneEndDate={modal.milestoneEndDate}
      milestoneEndTime={modal.milestoneEndTime}
      milestoneError={modal.milestoneError}
      milestoneStartDate={modal.milestoneStartDate}
      milestoneStartTime={modal.milestoneStartTime}
      isDeletingMilestone={modal.isDeletingMilestone}
      isSavingMilestone={modal.isSavingMilestone}
      milestoneModalMode={modal.activeMilestoneDetail ? "detail" : modal.milestoneModalMode}
      onClose={() => {
        modal.closeMilestoneModal();
        modal.closeMilestoneDetailModal();
      }}
      onCancelEdit={modal.cancelMilestoneEdit}
      onDelete={modal.handleMilestoneDelete}
      onSubmit={modal.handleMilestoneSubmit}
      onSwitchToTask={modal.milestoneModalMode === "create" ? modal.switchMilestoneCreateToTask : undefined}
      modalPortalTarget={modalPortalTarget}
      setMilestoneDraft={modal.setMilestoneDraft}
      setMilestoneEndDate={modal.setMilestoneEndDate}
      setMilestoneEndTime={modal.setMilestoneEndTime}
      setMilestoneStartDate={modal.setMilestoneStartDate}
      setMilestoneStartTime={modal.setMilestoneStartTime}
    />
  );
}
