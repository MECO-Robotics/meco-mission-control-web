import type { Dispatch, FormEvent, SetStateAction } from "react";
import { createPortal } from "react-dom";

import type { BootstrapPayload, MilestoneRecord } from "@/types";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline";

import { MilestonesEventDetailsModal } from "./MilestonesEventDetailsModal";
import { MilestonesMilestoneModalActions } from "./sections/MilestonesMilestoneModalActions";
import { MilestonesMilestoneModalFields } from "./sections/MilestonesMilestoneModalFields";
import { MilestonesMilestoneModalReadinessSection } from "./sections/MilestonesMilestoneModalReadinessSection";

type TaskPlanningState = "blocked" | "at-risk" | "waiting-on-dependency" | "ready" | "overdue";

interface MilestonesMilestoneModalProps {
  activeMilestone: MilestoneRecord | null;
  activeMilestoneCompleteTasks: BootstrapPayload["tasks"];
  activeMilestoneTasks: BootstrapPayload["tasks"];
  bootstrap: BootstrapPayload;
  milestoneError: string | null;
  milestoneModalMode: "create" | "detail" | "edit" | null;
  milestoneStartDate: string;
  milestoneStartTime: string;
  milestoneEndDate: string;
  milestoneEndTime: string;
  milestoneTaskGroups: Record<TaskPlanningState, BootstrapPayload["tasks"]>;
  milestoneTaskOrder: readonly TaskPlanningState[];
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  milestoneDraft: TimelineMilestoneDraft;
  modalPortalTarget: HTMLElement | null;
  onClose: () => void;
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
  activeMilestoneCompleteTasks,
  activeMilestoneTasks,
  bootstrap,
  milestoneError,
  milestoneModalMode,
  milestoneStartDate,
  milestoneStartTime,
  milestoneEndDate,
  milestoneEndTime,
  milestoneTaskGroups,
  milestoneTaskOrder,
  isDeletingMilestone,
  isSavingMilestone,
  milestoneDraft,
  modalPortalTarget,
  onClose,
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

  if (milestoneModalMode === "detail") {
    return activeMilestone ? (
      <MilestonesEventDetailsModal
        activeMilestone={activeMilestone}
        activeMilestoneCompleteTasks={activeMilestoneCompleteTasks}
        activeMilestoneTasks={activeMilestoneTasks}
        bootstrap={bootstrap}
        milestoneTaskGroups={milestoneTaskGroups}
        milestoneTaskOrder={milestoneTaskOrder}
        modalPortalTarget={modalPortalTarget}
        onClose={onClose}
        onEditMilestone={onEditMilestone}
        projectsById={projectsById}
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
        data-tutorial-target={
          milestoneModalMode === "create" ? "milestone-create-modal" : "milestone-edit-modal"
        }
        onClick={(milestone) => milestone.stopPropagation()}
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Timeline milestone
            </p>
            <h2 style={{ color: "var(--text-title)" }}>
              {milestoneModalMode === "create" ? "Add milestone" : "Edit milestone"}
            </h2>
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
            activeMilestoneCompleteTasks={activeMilestoneCompleteTasks}
            activeMilestoneTasks={activeMilestoneTasks}
            bootstrap={bootstrap}
            milestoneModalMode={milestoneModalMode}
            milestoneTaskGroups={milestoneTaskGroups}
            milestoneTaskOrder={milestoneTaskOrder}
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

