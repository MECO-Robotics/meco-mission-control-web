import type { Dispatch, FormEvent, SetStateAction } from "react";
import { createPortal } from "react-dom";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";

import { MilestonesEventDetailsModal } from "./MilestonesEventDetailsModal";
import { MilestonesMilestoneModalActions } from "./sections/MilestonesEventModalActions";
import { MilestonesMilestoneModalFields } from "./sections/MilestonesEventModalFields";
import { MilestonesMilestoneModalReadinessSection } from "./sections/MilestonesEventModalReadinessSection";

interface MilestonesMilestoneModalProps {
  activeMilestone: MilestoneRecord | null;
  bootstrap: BootstrapPayload;
  milestoneError: string | null;
  milestoneModalMode: "create" | "detail" | "edit" | null;
  milestoneStartDate: string;
  milestoneStartTime: string;
  milestoneEndDate: string;
  milestoneEndTime: string;
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  milestoneDraft: TimelineMilestoneDraft;
  modalPortalTarget: HTMLElement | null;
  onClose: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditMilestone: (milestone: MilestoneRecord) => void;
  onSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  setMilestoneEndDate: Dispatch<SetStateAction<string>>;
  setMilestoneEndTime: Dispatch<SetStateAction<string>>;
  setMilestoneStartDate: Dispatch<SetStateAction<string>>;
  setMilestoneStartTime: Dispatch<SetStateAction<string>>;
  setMilestoneDraft: Dispatch<SetStateAction<TimelineMilestoneDraft>>;
}

export function MilestonesMilestoneModal({
  activeMilestone,
  bootstrap,
  milestoneError,
  milestoneModalMode,
  milestoneStartDate,
  milestoneStartTime,
  milestoneEndDate,
  milestoneEndTime,
  isDeletingMilestone,
  isSavingMilestone,
  milestoneDraft,
  modalPortalTarget,
  onClose,
  onCancelEdit,
  onDelete,
  onEditMilestone,
  onSubmit,
  projectsById,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
  setMilestoneDraft,
}: MilestonesMilestoneModalProps) {
  if (!milestoneModalMode || !modalPortalTarget) {
    return null;
  }

  if (milestoneModalMode === "detail" || milestoneModalMode === "edit") {
    return activeMilestone ? (
      <MilestonesEventDetailsModal
        activeMilestone={activeMilestone}
        bootstrap={bootstrap}
        isDeletingMilestone={isDeletingMilestone}
        isSavingMilestone={isSavingMilestone}
        milestoneDraft={milestoneDraft}
        milestoneEndDate={milestoneEndDate}
        milestoneEndTime={milestoneEndTime}
        milestoneError={milestoneError}
        milestoneModalMode={milestoneModalMode}
        milestoneStartDate={milestoneStartDate}
        milestoneStartTime={milestoneStartTime}
        modalPortalTarget={modalPortalTarget}
        onClose={onClose}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onEditMilestone={onEditMilestone}
        onSubmit={onSubmit}
        projectsById={projectsById}
        setMilestoneDraft={setMilestoneDraft}
        setMilestoneEndDate={setMilestoneEndDate}
        setMilestoneEndTime={setMilestoneEndTime}
        setMilestoneStartDate={setMilestoneStartDate}
        setMilestoneStartTime={setMilestoneStartTime}
      />
    ) : null;
  }

  return createPortal(
    <div
      className="modal-scrim"
      onClick={onClose}
      role="presentation"
      style={{ zIndex: 2050 }}
    >
      <section
        aria-modal="true"
        className="modal-card"
        data-tutorial-target="milestone-create-modal"
        onClick={(milestone) => milestone.stopPropagation()}
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Timeline milestone
            </p>
            <h2 style={{ color: "var(--text-title)" }}>Add milestone</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ color: "var(--text-copy)", background: "transparent" }}
            type="button"
          >
            Close
          </button>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <MilestonesMilestoneModalFields
            bootstrap={bootstrap}
            milestoneEndDate={milestoneEndDate}
            milestoneEndTime={milestoneEndTime}
            milestoneError={milestoneError}
            milestoneStartDate={milestoneStartDate}
            milestoneStartTime={milestoneStartTime}
            milestoneDraft={milestoneDraft}
            setMilestoneEndDate={setMilestoneEndDate}
            setMilestoneEndTime={setMilestoneEndTime}
            setMilestoneStartDate={setMilestoneStartDate}
            setMilestoneStartTime={setMilestoneStartTime}
            setMilestoneDraft={setMilestoneDraft}
          />

          <MilestonesMilestoneModalReadinessSection
            activeMilestone={activeMilestone}
            bootstrap={bootstrap}
            milestoneModalMode={milestoneModalMode}
          />

          <MilestonesMilestoneModalActions
            milestoneModalMode={milestoneModalMode}
            isDeletingMilestone={isDeletingMilestone}
            isSavingMilestone={isSavingMilestone}
            onClose={onClose}
            onDelete={onDelete}
          />
        </form>
      </section>
    </div>,
    modalPortalTarget,
  );
}
