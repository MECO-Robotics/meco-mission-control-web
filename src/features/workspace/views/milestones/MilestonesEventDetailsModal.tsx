import type { CSSProperties, Dispatch, FormEvent, SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";
import { TaskDetailReveal } from "@/features/workspace/modals/task/details/TaskDetailReveal";
import { getMilestoneTaskBoardStateForMilestone, getMilestoneTaskBoardStateLabel, getMilestoneTasksForState } from "@/features/workspace/shared/milestones/milestoneTaskState";
import { EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import { MilestonesMilestoneModalReadinessSection } from "./sections/MilestonesEventModalReadinessSection";
import { MilestonesEventDetailEditor, type MilestoneDetailEditableField } from "./sections/MilestonesEventDetailEditor";
import {
  MilestoneDetailInlineValue,
  MilestoneDetailValue,
  MilestoneDetailsStatusIcon,
  MilestoneEditScheduleField,
  MilestoneEditTitleField,
} from "./MilestonesEventDetailsModalParts";
import { formatMilestoneDateTime, formatMilestoneEndDateTime } from "./milestonesViewUtils";

interface MilestonesEventDetailsModalProps {
  activeMilestone: MilestoneRecord;
  bootstrap: BootstrapPayload;
  milestoneModalMode: "detail" | "edit";
  isDeletingMilestone?: boolean;
  isSavingMilestone?: boolean;
  milestoneDraft?: TimelineMilestoneDraft;
  milestoneEndDate?: string;
  milestoneEndTime?: string;
  milestoneError?: string | null;
  milestoneStartDate?: string;
  milestoneStartTime?: string;
  modalPortalTarget: HTMLElement | null;
  onClose: () => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onEditMilestone: (milestone: MilestoneRecord) => void;
  onSubmit?: (milestone: FormEvent<HTMLFormElement>) => void;
  projectsById: Record<string, BootstrapPayload["projects"][number]>;
  setMilestoneDraft?: Dispatch<SetStateAction<TimelineMilestoneDraft>>;
  setMilestoneEndDate?: Dispatch<SetStateAction<string>>;
  setMilestoneEndTime?: Dispatch<SetStateAction<string>>;
  setMilestoneStartDate?: Dispatch<SetStateAction<string>>;
  setMilestoneStartTime?: Dispatch<SetStateAction<string>>;
}

export function MilestonesEventDetailsModal({
  activeMilestone,
  bootstrap,
  isDeletingMilestone,
  isSavingMilestone,
  milestoneDraft,
  milestoneEndDate,
  milestoneEndTime,
  milestoneError,
  milestoneModalMode,
  milestoneStartDate,
  milestoneStartTime,
  modalPortalTarget,
  onClose,
  onCancelEdit,
  onDelete,
  onEditMilestone,
  onSubmit,
  projectsById,
  setMilestoneDraft,
  setMilestoneEndDate,
  setMilestoneEndTime,
  setMilestoneStartDate,
  setMilestoneStartTime,
}: MilestonesEventDetailsModalProps) {
  const [editingField, setEditingField] = useState<MilestoneDetailEditableField | null>(null);

  useEffect(() => {
    setEditingField(null);
  }, [activeMilestone.id, milestoneModalMode]);

  if (!modalPortalTarget) {
    return null;
  }

  const isEditMode = milestoneModalMode === "edit";
  const handleClose = isEditMode && onCancelEdit ? onCancelEdit : onClose;
  const milestoneTypeStyle = MILESTONE_TYPE_STYLES[activeMilestone.type] ?? MILESTONE_TYPE_STYLES["internal-review"];
  const milestoneTypeStyleVariables = {
    "--milestone-type-chip-bg": milestoneTypeStyle.chipBackground,
    "--milestone-type-chip-border": milestoneTypeStyle.columnBorder,
    "--milestone-type-chip-text": milestoneTypeStyle.chipText,
    "--milestone-type-chip-bg-dark": milestoneTypeStyle.darkChipBackground,
    "--milestone-type-chip-border-dark": milestoneTypeStyle.darkColumnBorder,
    "--milestone-type-chip-text-dark": milestoneTypeStyle.darkChipText,
  } as CSSProperties;
  const milestoneTypeLabel = MILESTONE_TYPE_STYLES[activeMilestone.type]?.label ?? activeMilestone.type;
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
  const relatedProjectItems =
    projectNames.length > 0
      ? projectNames.map((projectName, index) => (
          <div className="task-details-assigned-item" key={`${projectName}-${index}`}>
            <TaskDetailReveal className="task-detail-ellipsis-reveal" text={projectName} />
          </div>
        ))
      : [
          <div className="task-details-assigned-empty" key="all-projects">
            All projects
          </div>,
        ];
  const editableMilestoneDraft =
    milestoneDraft ?? {
      title: activeMilestone.title,
      type: activeMilestone.type,
      description: activeMilestone.description,
      isExternal: activeMilestone.isExternal,
      projectIds: activeMilestone.projectIds,
    };
  const editableStartDate = milestoneStartDate ?? activeMilestone.startDateTime.slice(0, 10);
  const editableStartTime = milestoneStartTime ?? activeMilestone.startDateTime.slice(11, 16);
  const editableEndDate = milestoneEndDate ?? activeMilestone.endDateTime?.slice(0, 10) ?? "";
  const editableEndTime = milestoneEndTime ?? activeMilestone.endDateTime?.slice(11, 16) ?? "";
  const milestoneStartLabel = formatMilestoneDateTime(activeMilestone.startDateTime);
  const milestoneEndLabel = formatMilestoneEndDateTime(activeMilestone.startDateTime, activeMilestone.endDateTime);

  return createPortal(
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2050 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        data-tutorial-target={isEditMode ? "milestone-edit-modal" : "milestone-detail-modal"}
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              {isEditMode ? "Edit milestone details" : "Timeline milestone"}
            </p>
            <div className="task-detail-header-title-row">
              <div className="task-detail-header-title-stack">
                {isEditMode ? (
                  <MilestoneEditTitleField
                    editingField={editingField}
                    milestoneTitle={editableMilestoneDraft.title}
                    setEditingField={setEditingField}
                    setMilestoneTitle={(title) =>
                      setMilestoneDraft?.((current) => ({
                        ...current,
                        title,
                      }))
                    }
                  />
                ) : (
                  <div className="task-detail-header-title-main" onDoubleClick={() => onEditMilestone(activeMilestone)}>
                    <h2 style={{ color: "var(--text-title)" }}>{activeMilestone.title}</h2>
                  </div>
                )}
                <div className="task-detail-copy task-detail-header-meta-line">
                  {isEditMode ? (
                    <MilestoneEditScheduleField
                      activeMilestone={activeMilestone}
                      editingField={editingField}
                      milestoneEndDate={editableEndDate}
                      milestoneEndTime={editableEndTime}
                      milestoneStartDate={editableStartDate}
                      milestoneStartTime={editableStartTime}
                      setEditingField={setEditingField}
                      setMilestoneEndDate={setMilestoneEndDate ?? (() => undefined)}
                      setMilestoneEndTime={setMilestoneEndTime ?? (() => undefined)}
                      setMilestoneStartDate={setMilestoneStartDate ?? (() => undefined)}
                      setMilestoneStartTime={setMilestoneStartTime ?? (() => undefined)}
                    />
                  ) : (
                    <MilestoneDetailInlineValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)}>
                      <span style={{ alignItems: "center", display: "inline-flex", gap: "0.25rem", flexWrap: "wrap" }}>
                        <span className="pill status-pill status-pill-neutral">{milestoneStartLabel}</span>
                        {milestoneEndLabel ? (
                          <>
                            <span style={{ color: "var(--text-copy)", fontSize: "0.65rem", fontWeight: 700 }}>
                              to
                            </span>
                            <span className="pill status-pill status-pill-neutral">{milestoneEndLabel}</span>
                          </>
                        ) : null}
                      </span>
                    </MilestoneDetailInlineValue>
                  )}
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
            <button className="icon-button task-details-close-button" onClick={handleClose} type="button">
              {"\u00D7"}
            </button>
          </div>
        </div>

        {isEditMode ? (
          <MilestonesEventDetailEditor
            activeMilestone={activeMilestone}
            bootstrap={bootstrap}
            editingField={editingField}
            isDeletingMilestone={isDeletingMilestone ?? false}
            isSavingMilestone={isSavingMilestone ?? false}
            milestoneDraft={editableMilestoneDraft}
            milestoneError={milestoneError ?? null}
            onClose={handleClose}
            onDelete={onDelete ?? (() => undefined)}
            onSubmit={onSubmit ?? ((event) => event.preventDefault())}
            setEditingField={setEditingField}
            setMilestoneDraft={setMilestoneDraft ?? (() => undefined)}
          />
        ) : (
          <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
            <div className="milestone-detail-overview-grid modal-wide">
              <div className="field modal-wide milestone-detail-description">
                <span style={{ color: "var(--text-title)" }}>Description</span>
                <MilestoneDetailValue onOpenEditMilestone={() => onEditMilestone(activeMilestone)} showEditIndicator={isEditMode}>
                  <p className="task-detail-copy">{activeMilestone.description || "No description provided."}</p>
                </MilestoneDetailValue>
              </div>
              <div className="milestone-detail-type-row">
                <div className="field">
                  <span style={{ color: "var(--text-title)" }}>Type</span>
                  <MilestoneDetailValue
                    onOpenEditMilestone={() => onEditMilestone(activeMilestone)}
                    showEditIndicator={isEditMode}
                  >
                    <span className="pill status-pill milestone-type-pill" style={milestoneTypeStyleVariables}>
                      {milestoneTypeLabel}
                    </span>
                  </MilestoneDetailValue>
                </div>
                <div className="field">
                  <span style={{ color: "var(--text-title)" }}>Related projects</span>
                  <MilestoneDetailValue
                    onOpenEditMilestone={() => onEditMilestone(activeMilestone)}
                    showEditIndicator={isEditMode}
                  >
                    <div className="task-details-assigned-list">{relatedProjectItems}</div>
                  </MilestoneDetailValue>
                </div>
              </div>
            </div>

            <MilestonesMilestoneModalReadinessSection
              activeMilestone={activeMilestone}
              bootstrap={bootstrap}
              milestoneModalMode="detail"
            />

            <div className="modal-actions modal-wide">
              <button className="primary-action" onClick={() => onEditMilestone(activeMilestone)} type="button">
                Edit milestone
              </button>
            </div>
          </div>
        )}
      </section>
    </div>,
    modalPortalTarget,
  );
}
