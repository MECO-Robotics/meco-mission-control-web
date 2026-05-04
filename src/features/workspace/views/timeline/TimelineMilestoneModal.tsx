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
        onClick={(milestone) => milestone.stopPropagation()}
        role="dialog"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-base)",
          ...(mode === "create" ? { paddingTop: "0.65rem" } : null),
        }}
        >
        <TimelineMilestoneModalHeader
          activeMilestoneDay={activeMilestoneDay}
          mode={mode}
          onClose={onClose}
          onSwitchToTask={onSwitchToTask}
        />
        <form className="modal-form" onSubmit={onSubmit}>
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
            onClose={onClose}
            onDelete={onDelete}
          />
        </form>
      </section>
    </div>,
    portalTarget,
  );
};

