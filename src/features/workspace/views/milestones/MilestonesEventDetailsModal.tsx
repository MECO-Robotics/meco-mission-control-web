import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";

import type { BootstrapPayload, MilestoneRecord } from "@/types";
import {
  MilestoneTaskStateIcon,
  getMilestoneTaskBoardStateForMilestone,
  getMilestoneTaskBoardStateLabel,
  getMilestoneTasksForState,
} from "@/features/workspace/shared/milestones";
import { EditableHoverIndicator } from "@/features/workspace/shared/WorkspaceViewShared";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import type { TaskQueueBoardState } from "@/features/workspace/views/taskQueue/taskQueueKanbanBoardState";
import { MilestonesMilestoneModalReadinessSection } from "./sections/MilestonesMilestoneModalReadinessSection";
import { formatMilestoneDateTime } from "./milestonesViewUtils";

type TaskPlanningState = "blocked" | "at-risk" | "waiting-on-dependency" | "ready" | "overdue";

function MilestoneDetailValue({
  children,
  onOpenEditMilestone,
}: {
  children: ReactNode;
  onOpenEditMilestone: () => void;
}) {
  return (
    <button
      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
      onClick={onOpenEditMilestone}
      onDoubleClick={onOpenEditMilestone}
      type="button"
    >
      {children}
      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
    </button>
  );
}

function MilestoneDetailInlineValue({
  children,
  onOpenEditMilestone,
}: {
  children: ReactNode;
  onOpenEditMilestone: () => void;
}) {
  return (
    <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline milestone-detail-inline-value">
      <button
        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
        onClick={onOpenEditMilestone}
        onDoubleClick={onOpenEditMilestone}
        type="button"
      >
        {children}
        <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
      </button>
    </span>
  );
}

function MilestoneDetailsStatusIcon({
  label,
  state,
}: {
  label: string;
  state: TaskQueueBoardState;
}) {
  return (
    <span
      aria-label={label}
      className={`task-detail-header-status task-detail-header-status-signal-${state}`}
      title={label}
    >
      <span className="task-detail-header-status-icon">
        <MilestoneTaskStateIcon compact state={state} />
      </span>
      <span className="task-detail-header-status-caption">{label}</span>
    </span>
  );
}

interface MilestonesEventDetailsModalProps {
  activeMilestone: MilestoneRecord;
  activeMilestoneCompleteTasks: BootstrapPayload["tasks"];
  activeMilestoneTasks: BootstrapPayload["tasks"];
  bootstrap: BootstrapPayload;
  milestoneTaskGroups: Record<TaskPlanningState, BootstrapPayload["tasks"]>;
  milestoneTaskOrder: readonly TaskPlanningState[];
  modalPortalTarget: HTMLElement | null;
  onClose: () => void;
  onEditMilestone: (milestone: MilestoneRecord) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
}

export function MilestonesEventDetailsModal({
  activeMilestone,
  activeMilestoneCompleteTasks,
  activeMilestoneTasks,
  bootstrap,
  milestoneTaskGroups,
  milestoneTaskOrder,
  modalPortalTarget,
  onClose,
  onEditMilestone,
  projectsById,
}: MilestonesEventDetailsModalProps) {
  if (!modalPortalTarget) {
    return null;
  }

  const milestoneTypeStyle = MILESTONE_TYPE_STYLES[activeMilestone.type] ?? MILESTONE_TYPE_STYLES["internal-review"];
  const milestoneTypeStyleVariables = {
    "--milestone-type-chip-bg": milestoneTypeStyle.chipBackground,
    "--milestone-type-chip-border": milestoneTypeStyle.columnBorder,
    "--milestone-type-chip-text": milestoneTypeStyle.chipText,
    "--milestone-type-chip-bg-dark": milestoneTypeStyle.darkChipBackground,
    "--milestone-type-chip-border-dark": milestoneTypeStyle.darkColumnBorder,
    "--milestone-type-chip-text-dark": milestoneTypeStyle.darkChipText,
  } as CSSProperties;
  const milestoneTaskState = getMilestoneTaskBoardStateForMilestone(activeMilestone, bootstrap);
  const statusText = getMilestoneTaskBoardStateLabel(milestoneTaskState);
  const milestoneRequirementTasks = getMilestoneTasksForState(activeMilestone, bootstrap);
  const milestoneEstimatedHours = milestoneRequirementTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.estimatedHours) || 0),
    0,
  );
  const milestoneActualHours = milestoneRequirementTasks.reduce(
    (total, task) => total + Math.max(0, Number(task.actualHours) || 0),
    0,
  );
  const milestoneLoggedHoursClassName =
    milestoneEstimatedHours > 0
      ? milestoneActualHours === 0
        ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
        : milestoneActualHours <= milestoneEstimatedHours
          ? "pill task-detail-hours-pill task-detail-hours-pill-success"
          : milestoneActualHours < milestoneEstimatedHours * 1.5
            ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
            : "pill task-detail-hours-pill task-detail-hours-pill-danger"
      : "pill task-detail-hours-pill task-detail-hours-pill-neutral";
  const projectNames = activeMilestone.projectIds
    .map((projectId) => projectsById[projectId]?.name)
    .filter((projectName): projectName is string => Boolean(projectName));

  return createPortal(
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2050 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        data-tutorial-target="milestone-detail-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              Timeline milestone
            </p>
            <div className="task-detail-header-title-row">
              <div className="task-detail-header-title-stack">
                <div className="task-detail-header-title-main" onDoubleClick={() => onEditMilestone(activeMilestone)}>
                  <h2 style={{ color: "var(--text-title)" }}>{activeMilestone.title}</h2>
                </div>
                <div className="task-detail-copy task-detail-header-meta-line">
                  <MilestoneDetailInlineValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                    <span className="pill status-pill status-pill-neutral">
                      {formatMilestoneDateTime(activeMilestone.startDateTime)}
                    </span>
                  </MilestoneDetailInlineValue>
                  <span style={{ color: "var(--text-copy)" }}> {"->"} </span>
                  <MilestoneDetailInlineValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                    <span className="pill status-pill status-pill-neutral">
                      {activeMilestone.endDateTime ? formatMilestoneDateTime(activeMilestone.endDateTime) : "No end date"}
                    </span>
                  </MilestoneDetailInlineValue>
                </div>
              </div>
              <div className="task-detail-header-side-stack">
                <MilestoneDetailsStatusIcon label={statusText} state={milestoneTaskState} />
                <span className="task-detail-header-hours-inline task-detail-header-hours-right">
                  <span className="task-detail-header-hours-label">Logged:</span>
                  <span className={milestoneLoggedHoursClassName}>{milestoneActualHours}h</span>
                  <span className="task-detail-hour-separator">/</span>
                  <span className="task-detail-hours-estimate">{milestoneEstimatedHours}h</span>
                </span>
              </div>
            </div>
          </div>
          <div className="panel-actions">
            <button className="icon-button task-details-close-button" onClick={onClose} type="button">
              {"\u00D7"}
            </button>
          </div>
        </div>

        <div className="task-detail-copy modal-wide milestone-detail-type-line">
          <span style={{ color: "var(--text-title)" }}>Type</span>
          <MilestoneDetailValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
            <span className="pill status-pill milestone-type-pill" style={milestoneTypeStyleVariables}>
              {milestoneTypeStyle.label}
            </span>
          </MilestoneDetailValue>
        </div>

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
          <div className="task-details-section-grid task-details-overview-grid modal-wide">
            <div className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>Description</span>
              <MilestoneDetailValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                <p className="task-detail-copy">{activeMilestone.description || "No description provided."}</p>
              </MilestoneDetailValue>
            </div>
            <div className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>Related projects</span>
              <MilestoneDetailValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                <p className="task-detail-copy">{projectNames.length > 0 ? projectNames.join(", ") : "All projects"}</p>
              </MilestoneDetailValue>
            </div>
            <div className="field modal-wide">
              <span style={{ color: "var(--text-title)" }}>External milestone</span>
              <MilestoneDetailValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                <p className="task-detail-copy">{activeMilestone.isExternal ? "Yes" : "No"}</p>
              </MilestoneDetailValue>
            </div>
          </div>

          <MilestonesMilestoneModalReadinessSection
            activeMilestone={activeMilestone}
            activeMilestoneCompleteTasks={activeMilestoneCompleteTasks}
            activeMilestoneTasks={activeMilestoneTasks}
            bootstrap={bootstrap}
            milestoneModalMode="detail"
            milestoneTaskGroups={milestoneTaskGroups}
            milestoneTaskOrder={milestoneTaskOrder}
          />

          <div className="modal-actions modal-wide">
            <button
              className="secondary-action"
              onClick={onClose}
              style={{
                background: "var(--bg-row-alt)",
                color: "var(--text-title)",
                border: "1px solid var(--border-base)",
              }}
              type="button"
            >
              Close
            </button>
            <button className="primary-action" onClick={() => onEditMilestone(activeMilestone)} type="button">
              Edit milestone
            </button>
          </div>
        </div>
      </section>
    </div>,
    modalPortalTarget,
  );
}
