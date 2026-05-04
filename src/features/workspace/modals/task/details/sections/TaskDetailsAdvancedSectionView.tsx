import { useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { EditableHoverIndicator, FilterDropdown } from "../../../../shared/WorkspaceViewShared";
import { IconManufacturing, IconPlus, IconTrash } from "@/components/shared/Icons";
import type { TaskDetailsEditableField } from "../../taskModalTypes";
import { TaskDetailReveal } from "../TaskDetailReveal";
import { useTaskDetailsAdvancedSectionModel } from "./useTaskDetailsAdvancedSectionModel";

interface TaskDetailsAdvancedSectionViewProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  advancedSectionOpen: boolean;
  canInlineEdit: boolean;
  editingField: TaskDetailsEditableField | null;
  openTaskEditModal: () => void;
  setAdvancedSectionOpen: Dispatch<SetStateAction<boolean>>;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsAdvancedSectionView(props: TaskDetailsAdvancedSectionViewProps) {
  const {
    activeTask,
    bootstrap,
    advancedSectionOpen,
    canInlineEdit,
    editingField,
    openTaskEditModal,
    setAdvancedSectionOpen,
    setEditingField,
    setTaskDraft,
    taskDraft,
  } = props;
  const model = useTaskDetailsAdvancedSectionModel({
    activeTask,
    bootstrap,
    setEditingField,
    setTaskDraft,
    taskDraft,
  });
  const editableTask = model.editableTask;
  const [mechanismAddMenuKey, setMechanismAddMenuKey] = useState(0);
  const [partAddMenuKey, setPartAddMenuKey] = useState(0);
  const mechanismAddOptions = model.projectMechanisms
    .filter((mechanism) => !model.selectedMechanismIds.includes(mechanism.id))
    .map((mechanism) => ({
      id: mechanism.id,
      name: `${mechanism.name} (${mechanism.iteration})`,
    }));
  const partAddOptions = model.projectPartInstances
    .filter((partInstance) => !model.selectedPartInstanceIds.includes(partInstance.id))
    .map((partInstance) => ({
      id: partInstance.id,
      name: `${partInstance.name}`,
    }));

  return (
    <details
      className="task-details-section-collapse modal-wide"
      open={advancedSectionOpen}
      onToggle={(milestone) => setAdvancedSectionOpen(milestone.currentTarget.open)}
    >
      <summary className="task-details-section-title task-details-section-summary">
        <span>Advanced</span>
      </summary>
      <div className="task-details-section-grid">
        <label className={`field task-detail-row ${canInlineEdit ? "task-details-inline-edit-left" : ""}`}>
          <span style={{ color: "var(--text-title)" }}>Discipline</span>
          {canInlineEdit ? (
            editingField === "discipline" ? (
              <FilterDropdown
                allLabel="Not set"
                ariaLabel="Set task discipline"
                buttonInlineEditField="discipline"
                className="task-queue-filter-menu-submenu"
                icon={<IconManufacturing />}
                getOptionToneClassName={model.getDisciplineOptionToneClassName}
                getSelectedToneClassName={(selection) =>
                  selection[0]
                    ? model.getDisciplineOptionToneClassName({ id: selection[0] })
                    : undefined
                }
                singleSelect
                onChange={model.handleDisciplineChange}
                options={model.availableDisciplines}
                value={editableTask.disciplineId ? [editableTask.disciplineId] : []}
              />
            ) : (
              <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline task-detail-inline-edit-shell-inline-left">
                <button
                  className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                  data-inline-edit-field="discipline"
                  onClick={() => setEditingField("discipline")}
                  type="button"
                >
                  <span className={model.disciplinePillClassName} style={model.disciplinePillStyle}>
                    {model.disciplineText}
                  </span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </span>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              <span className={model.disciplinePillClassName} style={model.disciplinePillStyle}>
                {model.disciplineText}
              </span>
            </p>
          )}
        </label>
        <label className={`field task-detail-row ${canInlineEdit ? "task-details-inline-edit-left" : ""}`}>
          <span style={{ color: "var(--text-title)" }}>Start date</span>
          {canInlineEdit ? (
            editingField === "startDate" ? (
              <input
                aria-label="Start date"
                autoFocus
                className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
                data-inline-edit-field="startDate"
                onBlur={() => setEditingField(null)}
                onChange={model.handleStartDateChange}
                type="date"
                value={editableTask.startDate}
              />
            ) : (
              <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline task-detail-inline-edit-shell-inline-left">
                <button
                  className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                  data-inline-edit-field="startDate"
                  onClick={() => setEditingField("startDate")}
                  type="button"
                >
                  <span className="pill status-pill status-pill-neutral">
                    {new Date(`${editableTask.startDate}T00:00:00`).toLocaleDateString()}
                  </span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </span>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              <span className="pill status-pill status-pill-neutral">
                {new Date(`${editableTask.startDate}T00:00:00`).toLocaleDateString()}
              </span>
            </p>
          )}
        </label>
        <label className="field task-detail-row task-detail-collapsible-field">
          <details className="task-detail-collapsible" onDoubleClick={canInlineEdit ? undefined : openTaskEditModal}>
            <summary className="task-detail-collapsible-summary">
              <span className="task-detail-collapsible-summary-main">
                <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                <span className="task-detail-copy">{canInlineEdit ? "Mechanism" : "Mechanisms"}</span>
              </span>
              {canInlineEdit ? (
                mechanismAddOptions.length > 0 ? (
                  <FilterDropdown
                    key={mechanismAddMenuKey}
                    allLabel="Add mechanism"
                    ariaLabel="Add mechanism"
                    buttonInlineEditField="mechanism-add"
                    className="task-details-section-add-menu task-details-dependency-kind-menu"
                    icon={<IconPlus />}
                    menuClassName="task-details-dependency-menu-popup"
                    onChange={(selection) => {
                      const mechanismId = selection[0];
                      if (mechanismId) {
                        model.addMechanismSelection(mechanismId);
                        setMechanismAddMenuKey((current) => current + 1);
                      }
                    }}
                    options={mechanismAddOptions}
                    portalMenu
                    portalMenuPlacement="below"
                    showAllOption={false}
                    singleSelect
                    value={[]}
                  />
                ) : null
              ) : null}
            </summary>
            <div className="task-detail-collapsible-body">
              {model.mechanismRows.length > 0 ? (
                <div className="task-details-dependency-editor">
                  {model.mechanismRows.map((mechanism, index) => (
                    <div
                      className="workspace-detail-list-item task-detail-list-item task-details-dependency-row task-details-dependency-row-with-delete"
                      key={mechanism.id}
                    >
                      <button
                        aria-label={`Remove mechanism ${index + 1}`}
                        className="icon-button task-details-dependency-row-remove-button"
                        onClick={() => model.removeMechanismSelection(mechanism.id)}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                      <div
                        className="task-details-dependency-row-button task-details-mechanism-row-button"
                      >
                        <TaskDetailReveal
                          className="task-detail-ellipsis-reveal"
                          style={{ color: "var(--text-title)", fontWeight: 800 }}
                          text={mechanism.label}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !canInlineEdit ? (
                <div className="task-details-mechanism-list">
                  {model.mechanismNames.map((mechanismName, index) => (
                    <div className="task-details-mechanism-item" key={`${mechanismName}-${index}`}>
                      <TaskDetailReveal className="task-detail-ellipsis-reveal" text={mechanismName} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                  No mechanism linked
                </p>
              )}
            </div>
          </details>
        </label>
        <label className="field task-detail-row task-detail-collapsible-field">
          <details className="task-detail-collapsible" onDoubleClick={canInlineEdit ? undefined : openTaskEditModal}>
            <summary className="task-detail-collapsible-summary">
              <span className="task-detail-collapsible-summary-main">
                <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                <span className="task-detail-copy">Parts</span>
              </span>
              {canInlineEdit ? (
                partAddOptions.length > 0 ? (
                  <FilterDropdown
                    key={partAddMenuKey}
                    allLabel="Add part"
                    ariaLabel="Add part"
                    buttonInlineEditField="parts-add"
                    className="task-details-section-add-menu task-details-dependency-kind-menu"
                    icon={<IconPlus />}
                    menuClassName="task-details-dependency-menu-popup"
                    onChange={(selection) => {
                      const partInstanceId = selection[0];
                      if (partInstanceId) {
                        model.addPartInstanceSelection(partInstanceId);
                        setPartAddMenuKey((current) => current + 1);
                      }
                    }}
                    options={partAddOptions}
                    portalMenu
                    portalMenuPlacement="below"
                    showAllOption={false}
                    singleSelect
                    value={[]}
                  />
                ) : null
              ) : null}
            </summary>
            <div className="task-detail-collapsible-body">
              {model.partRows.length > 0 ? (
                <div className="task-details-dependency-editor">
                  {model.partRows.map((partInstance, index) => (
                    <div
                      className="workspace-detail-list-item task-detail-list-item task-details-dependency-row task-details-dependency-row-with-delete"
                      key={partInstance.id}
                    >
                      <button
                        aria-label={`Remove part ${index + 1}`}
                        className="icon-button task-details-dependency-row-remove-button"
                        onClick={() => model.removePartInstanceSelection(partInstance.id)}
                        type="button"
                      >
                        <IconTrash />
                      </button>
                      <div
                        className="task-details-dependency-row-button task-details-parts-row-button"
                      >
                        <TaskDetailReveal
                          className="task-detail-ellipsis-reveal"
                          style={{ color: "var(--text-title)", fontWeight: 800 }}
                          text={partInstance.label}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !canInlineEdit ? (
                <p className="task-detail-copy">
                  <TaskDetailReveal className="task-detail-ellipsis-reveal" text={model.partsText} />
                </p>
              ) : (
                <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                  No part linked
                </p>
              )}
            </div>
          </details>
        </label>
      </div>
    </details>
  );
}
