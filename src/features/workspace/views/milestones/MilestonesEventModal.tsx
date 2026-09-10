import { ModalDialog } from "@/components/ModalDialog";
import { useLayoutEffect, useRef, type Dispatch, type FormEvent, type SetStateAction } from "react";
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
  onRecordResult?: (milestone: MilestoneRecord) => void;
  onSwitchToTask?: () => void;
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
  onRecordResult,
  onSwitchToTask,
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
  const draftSignature = JSON.stringify([milestoneDraft, milestoneStartDate, milestoneStartTime, milestoneEndDate, milestoneEndTime]);
  const initialDraft = useRef(draftSignature);
  const previousMode = useRef(milestoneModalMode);
  useLayoutEffect(() => {
    if (previousMode.current !== milestoneModalMode) {
      initialDraft.current = draftSignature;
      previousMode.current = milestoneModalMode;
    }
  }, [draftSignature, milestoneModalMode]);
  const leaveEditor = (leave: () => void) => {
    if (isSavingMilestone || isDeletingMilestone) return;
    if (milestoneModalMode !== "detail" && draftSignature !== initialDraft.current && !window.confirm("Discard unsaved changes?")) return;
    leave();
  };

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
        onClose={() => leaveEditor(onClose)}
        onRecordResult={onRecordResult}
        onCancelEdit={() => leaveEditor(onCancelEdit)}
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
    <ModalDialog label="Add milestone" onClose={() => leaveEditor(onClose)} dismissOnBackdrop>
      <section
        className="modal-card task-details-modal"
        data-tutorial-target="milestone-create-modal"
        onClick={(milestone) => milestone.stopPropagation()}
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>

            <h2 style={{ color: "var(--text-title)" }}>Add milestone</h2>
          </div>
          <button
            aria-label="Close milestone modal"
            className="icon-button task-details-close-button"
            onClick={() => leaveEditor(onClose)}
            type="button"
          >
            {"\u00D7"}
          </button>
        </div>

        {onSwitchToTask ? <button className="secondary-action" type="button" onClick={() => leaveEditor(onSwitchToTask)}>Create task instead</button> : null}
        <form className="modal-form task-details-grid" onSubmit={onSubmit}>
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
            onClose={() => leaveEditor(onClose)}
            onDelete={onDelete}
          />
        </form>
      </section>
    </ModalDialog>,
    modalPortalTarget,
  );
}
