import type { CSSProperties, Dispatch, FormEvent, ReactNode, SetStateAction } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";
import type { MilestoneRecord } from "@/types/recordsExecution";
import type { TimelineMilestoneDraft } from "@/features/workspace/shared/timeline/timelineEventHelpers";
import { EditableHoverIndicator } from "@/features/workspace/shared/table/workspaceTableChrome";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import { EVENT_TYPE_OPTIONS, EVENT_TYPE_STYLES as MILESTONE_TYPE_STYLES } from "@/features/workspace/shared/events/eventStyles";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import { MilestonesMilestoneModalActions } from "./MilestonesEventModalActions";
import { MilestonesMilestoneModalReadinessSection } from "./MilestonesEventModalReadinessSection";

export type MilestoneDetailEditableField = "title" | "schedule" | "description" | "type" | "projects" | "external";

interface MilestonesEventDetailEditorProps {
  activeMilestone: MilestoneRecord;
  bootstrap: BootstrapPayload;
  editingField: MilestoneDetailEditableField | null;
  isDeletingMilestone: boolean;
  isSavingMilestone: boolean;
  milestoneDraft: TimelineMilestoneDraft;
  milestoneError: string | null;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: (milestone: FormEvent<HTMLFormElement>) => void;
  setEditingField: Dispatch<SetStateAction<MilestoneDetailEditableField | null>>;
  setMilestoneDraft: Dispatch<SetStateAction<TimelineMilestoneDraft>>;
}

const MILESTONE_TYPE_OPTIONS: DropdownOption[] = EVENT_TYPE_OPTIONS.map((option) => ({
  id: option.value,
  name: option.label,
}));

function MilestoneFieldValue({
  children,
  onOpenEditField,
}: {
  children: ReactNode;
  onOpenEditField: () => void;
}) {
  return (
    <div className="task-detail-inline-edit-shell">
      <button
        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
        onClick={onOpenEditField}
        onDoubleClick={onOpenEditField}
        type="button"
      >
        {children}
      </button>
      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
    </div>
  );
}

function MilestoneFieldChipValue({
  children,
  onOpenEditField,
}: {
  children: ReactNode;
  onOpenEditField: () => void;
}) {
  return (
    <div className="task-detail-inline-edit-shell">
      <button
        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-chip"
        onClick={onOpenEditField}
        onDoubleClick={onOpenEditField}
        type="button"
      >
        {children}
      </button>
      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
    </div>
  );
}

export function MilestonesEventDetailEditor({
  activeMilestone,
  bootstrap,
  editingField,
  isDeletingMilestone,
  isSavingMilestone,
  milestoneDraft,
  milestoneError,
  onClose,
  onDelete,
  onSubmit,
  setEditingField,
  setMilestoneDraft,
}: MilestonesEventDetailEditorProps) {
  const milestoneTypeStyle =
    MILESTONE_TYPE_STYLES[milestoneDraft.type] ?? MILESTONE_TYPE_STYLES["internal-review"];
  const projectNames = milestoneDraft.projectIds
    .map((projectId) => bootstrap.projects.find((project) => project.id === projectId)?.name)
    .filter((projectName): projectName is string => Boolean(projectName));
  const projectOptions = bootstrap.projects.map((project) => ({
    id: project.id,
    name: project.name,
  }));
  const typeLabel = milestoneTypeStyle.label;
  const milestoneTypeStyleVariables = {
    "--milestone-type-chip-bg": milestoneTypeStyle.chipBackground,
    "--milestone-type-chip-border": milestoneTypeStyle.columnBorder,
    "--milestone-type-chip-text": milestoneTypeStyle.chipText,
    "--milestone-type-chip-bg-dark": milestoneTypeStyle.darkChipBackground,
    "--milestone-type-chip-border-dark": milestoneTypeStyle.darkColumnBorder,
    "--milestone-type-chip-text-dark": milestoneTypeStyle.darkChipText,
  } as CSSProperties;
  const isExternalLabel = milestoneDraft.isExternal ? "External milestone" : "Internal milestone";

  return (
    <form className="modal-form task-details-grid" onSubmit={onSubmit} style={{ color: "var(--text-copy)" }}>
      <div className="task-details-section-grid task-details-overview-grid modal-wide">
        <div className="field modal-wide">
          <span style={{ color: "var(--text-title)" }}>Description</span>
          {editingField === "description" ? (
            <textarea
              autoFocus
              className="task-detail-inline-edit-textarea"
              onBlur={() => setEditingField(null)}
              onChange={(milestone) =>
                setMilestoneDraft((current) => ({
                  ...current,
                  description: milestone.target.value,
                }))
              }
              rows={3}
              value={milestoneDraft.description}
            />
          ) : (
            <MilestoneFieldValue onOpenEditField={() => setEditingField("description")}>
              <p className="task-detail-copy">{milestoneDraft.description || "No description provided."}</p>
            </MilestoneFieldValue>
          )}
        </div>

        <div className="field modal-wide">
          <span style={{ color: "var(--text-title)" }}>Type</span>
          {editingField === "type" ? (
            <FilterDropdown
              allLabel="Type"
              ariaLabel="Set milestone type"
              buttonInlineEditField="type"
              className="task-queue-filter-menu-submenu"
              buttonContent={
                <span className="pill status-pill milestone-type-pill" style={milestoneTypeStyleVariables}>
                  {typeLabel}
                </span>
              }
              icon={
                <span className="pill status-pill milestone-type-pill" style={milestoneTypeStyleVariables}>
                  {typeLabel}
                </span>
              }
              onChange={(selection) => {
                const nextType = selection[0];
                if (!nextType) {
                  return;
                }

                setMilestoneDraft((current) => ({
                  ...current,
                  type: nextType as MilestoneRecord["type"],
                }));
                setEditingField(null);
              }}
              options={MILESTONE_TYPE_OPTIONS}
              singleSelect
              value={milestoneDraft.type ? [milestoneDraft.type] : []}
            />
          ) : (
            <MilestoneFieldChipValue onOpenEditField={() => setEditingField("type")}>
              <span className="pill status-pill milestone-type-pill" style={milestoneTypeStyleVariables}>
                {typeLabel}
              </span>
            </MilestoneFieldChipValue>
          )}
        </div>

        <div className="field modal-wide">
          <span style={{ color: "var(--text-title)" }}>Related projects</span>
          {editingField === "projects" ? (
            <FilterDropdown
              allLabel="All projects"
              ariaLabel="Set related projects"
              buttonInlineEditField="projects"
              className="task-queue-filter-menu-submenu"
              buttonContent={
                projectNames.length > 0 ? (
                  <p className="task-detail-copy" style={{ margin: 0 }}>
                    {projectNames.join(", ")}
                  </p>
                ) : (
                  <p className="task-detail-copy" style={{ margin: 0 }}>
                    All projects
                  </p>
                )
              }
              icon={<span className="pill status-pill status-pill-neutral">Projects</span>}
              onChange={(selection) => {
                setMilestoneDraft((current) => ({
                  ...current,
                  projectIds: [...selection],
                }));
                setEditingField(null);
              }}
              options={projectOptions}
              value={milestoneDraft.projectIds}
            />
          ) : (
            <MilestoneFieldValue onOpenEditField={() => setEditingField("projects")}>
              <p className="task-detail-copy">{projectNames.length > 0 ? projectNames.join(", ") : "All projects"}</p>
            </MilestoneFieldValue>
          )}
        </div>

        <div className="field modal-wide">
          <span style={{ color: "var(--text-title)" }}>Visibility</span>
          {editingField === "external" ? (
            <label className="checkbox-field" style={{ marginTop: "0.35rem" }}>
              <input
                checked={milestoneDraft.isExternal}
                onChange={(milestone) => {
                  setMilestoneDraft((current) => ({
                    ...current,
                    isExternal: milestone.target.checked,
                  }));
                  setEditingField(null);
                }}
                type="checkbox"
              />
              <span style={{ color: "var(--text-title)" }}>External milestone</span>
            </label>
          ) : (
            <MilestoneFieldChipValue onOpenEditField={() => setEditingField("external")}>
              <span className="pill status-pill status-pill-neutral">{isExternalLabel}</span>
            </MilestoneFieldChipValue>
          )}
        </div>
      </div>

      <MilestonesMilestoneModalReadinessSection
        activeMilestone={activeMilestone}
        bootstrap={bootstrap}
        milestoneModalMode="edit"
      />

      {milestoneError ? (
        <p className="section-copy modal-wide" style={{ color: "var(--official-red)" }}>
          {milestoneError}
        </p>
      ) : null}

      <MilestonesMilestoneModalActions
        milestoneModalMode="edit"
        isDeletingMilestone={isDeletingMilestone}
        isSavingMilestone={isSavingMilestone}
        onClose={onClose}
        onDelete={onDelete}
      />
    </form>
  );
}
