import { ModalDialog } from "@/components/ModalDialog";
import React from "react";
import { createPortal } from "react-dom";
import type { TimelineMilestoneModalProps } from "./timelineMilestoneModalTypes";
import { TimelineMilestoneModalActions } from "./components/TimelineMilestoneModalActions";
import { TimelineMilestoneModalFields } from "./components/TimelineMilestoneModalFields";
import { TimelineMilestoneModalHeader } from "./components/TimelineMilestoneModalHeader";

export const TimelineMilestoneModal: React.FC<TimelineMilestoneModalProps> = ({
  activeDayMilestones,
  activeMilestoneDay,
  bootstrap,
  milestoneDraft,
  milestoneEndDate,
  milestoneEndTime,
  milestoneError,
  milestoneStartDate,
  milestoneStartTime,
  isDeletingMilestone,
  isSavingMilestone,
  mode,
  onClose,
  onCancelEdit,
  onDelete,
  onSubmit,
  onSwitchToTask,
  portalTarget,
  setMilestoneDraft,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
}) => {
  if (!mode || !portalTarget) {
    return null;
  }

  const handleClose = mode === "edit" ? onCancelEdit : onClose;

  return createPortal(
    <ModalDialog label="Milestone editor" onClose={handleClose} dismissOnBackdrop>
      <section
        className="modal-card task-details-modal"
        onClick={(milestone) => milestone.stopPropagation()}
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
        }}
        >
        <TimelineMilestoneModalHeader
          activeMilestoneDay={activeMilestoneDay}
          mode={mode}
          onClose={handleClose}
          onSwitchToTask={onSwitchToTask}
        />
        <form className="modal-form task-details-grid" onSubmit={onSubmit}>
          <TimelineMilestoneModalFields
            activeDayMilestones={activeDayMilestones}
            bootstrap={bootstrap}
            milestoneDraft={milestoneDraft}
            milestoneEndDate={milestoneEndDate}
            milestoneEndTime={milestoneEndTime}
            milestoneError={milestoneError}
            milestoneStartDate={milestoneStartDate}
            milestoneStartTime={milestoneStartTime}
            mode={mode}
            setMilestoneDraft={setMilestoneDraft}
            setMilestoneEndDate={setMilestoneEndDate}
            setMilestoneEndTime={setMilestoneEndTime}
            setMilestoneStartDate={setMilestoneStartDate}
            setMilestoneStartTime={setMilestoneStartTime}
          />
          <TimelineMilestoneModalActions
            isDeletingMilestone={isDeletingMilestone}
            isSavingMilestone={isSavingMilestone}
            mode={mode}
            onClose={handleClose}
            onDelete={onDelete}
          />
        </form>
      </section>
    </ModalDialog>,
    portalTarget,
  );
};
