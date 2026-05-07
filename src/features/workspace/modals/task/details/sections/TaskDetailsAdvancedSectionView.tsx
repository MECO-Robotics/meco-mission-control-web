import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { EditableHoverIndicator } from "../../../../shared/table/workspaceTableChrome";
import { FilterDropdown } from "../../../../shared/filters/FilterDropdown";
import { IconManufacturing, IconPlus } from "@/components/shared/Icons";
import type { TaskDetailsEditableField } from "../../taskModalTypes";
import { TaskDetailReveal } from "../TaskDetailReveal";
import { TaskDetailsLinkedEntitySection } from "./TaskDetailsLinkedEntitySection";
import { useTaskDetailsAdvancedSectionModel } from "./useTaskDetailsAdvancedSectionModel";

interface TaskDetailsAdvancedSectionViewProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  advancedSectionOpen: boolean;
  canInlineEdit: boolean;
  collapsibleOpen?: boolean;
  onCollapsibleToggle?: (open: boolean) => void;
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
    collapsibleOpen,
    onCollapsibleToggle,
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
  const [linkedDetailsOpen, setLinkedDetailsOpen] = useState(true);
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

  useEffect(() => {
    setLinkedDetailsOpen(true);
  }, [activeTask.id]);

  const isMechanismAndPartsOpen = collapsibleOpen ?? linkedDetailsOpen;
  const handleLinkedDetailsToggle = (nextOpen: boolean) => {
    setLinkedDetailsOpen(nextOpen);
    onCollapsibleToggle?.(nextOpen);
  };

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
        <TaskDetailsLinkedEntitySection
          addControl={
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
          }
          canInlineEdit={canInlineEdit}
          emptyText="No mechanism linked"
          onDoubleClick={openTaskEditModal}
          onRemove={model.removeMechanismSelection}
          onToggle={handleLinkedDetailsToggle}
          open={isMechanismAndPartsOpen}
          readOnlyContent={
            <div className="task-details-mechanism-list">
              {model.mechanismNames.map((mechanismName, index) => (
                <div className="task-details-mechanism-item" key={`${mechanismName}-${index}`}>
                  <TaskDetailReveal className="task-detail-ellipsis-reveal" text={mechanismName} />
                </div>
              ))}
            </div>
          }
          removeEntityLabel="mechanism"
          rowButtonClassName="task-details-mechanism-row-button"
          rows={model.mechanismRows}
          title={canInlineEdit ? "Mechanism" : "Mechanisms"}
        />
        <TaskDetailsLinkedEntitySection
          addControl={
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
          }
          canInlineEdit={canInlineEdit}
          emptyText="No part linked"
          onDoubleClick={openTaskEditModal}
          onRemove={model.removePartInstanceSelection}
          onToggle={handleLinkedDetailsToggle}
          open={isMechanismAndPartsOpen}
          readOnlyContent={
            <p className="task-detail-copy">
              <TaskDetailReveal className="task-detail-ellipsis-reveal" text={model.partsText} />
            </p>
          }
          removeEntityLabel="part"
          rowButtonClassName="task-details-parts-row-button"
          rows={model.partRows}
          title="Parts"
        />
      </div>
    </details>
  );
}
