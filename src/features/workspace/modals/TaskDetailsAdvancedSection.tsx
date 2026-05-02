import type { Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { EditableHoverIndicator, FilterDropdown } from "../shared/WorkspaceViewShared";
import {
  getTaskPrimaryTargetNameOptions,
  getTaskSelectedMechanismIds,
  getTaskSelectedPartInstanceIds,
  getTaskSelectedPrimaryTargetId,
  getTaskTargetGroupLabel,
  setTaskPrimaryTargetSelection,
} from "../shared/taskTargeting";
import { formatIterationVersion } from "@/lib/appUtils";
import { getTaskDisciplinesForProject } from "@/lib/taskDisciplines";
import type { TaskDetailsEditableField } from "./taskModalTypes";
import { IconManufacturing, IconParts } from "@/components/shared/Icons";

interface TaskDetailsAdvancedSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  editingField: TaskDetailsEditableField | null;
  openTaskEditModal: () => void;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsAdvancedSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  editingField,
  openTaskEditModal,
  setEditingField,
  setTaskDraft,
  taskDraft,
}: TaskDetailsAdvancedSectionProps) {
  const editableTask = taskDraft ?? activeTask;
  const selectedProject = bootstrap.projects.find((project) => project.id === editableTask.projectId) ?? null;
  const availableDisciplines = getTaskDisciplinesForProject(selectedProject);
  const targetGroupLabel = getTaskTargetGroupLabel(selectedProject);
  const subsystemFieldLabel = targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream";
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism] as const),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance] as const),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
  const projectSubsystems = bootstrap.subsystems
    .filter((subsystem) => subsystem.projectId === editableTask.projectId)
    .sort((left, right) => left.name.localeCompare(right.name) || left.iteration - right.iteration);
  const selectedPrimaryTargetId = getTaskSelectedPrimaryTargetId(editableTask);
  const primaryTargetNameOptions = getTaskPrimaryTargetNameOptions(projectSubsystems);
  const selectedPrimaryTarget = selectedPrimaryTargetId
    ? subsystemsById[selectedPrimaryTargetId] ?? null
    : null;
  const projectMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === selectedPrimaryTargetId,
  );
  const projectPartInstances = bootstrap.partInstances.filter(
    (partInstance) => partInstance.subsystemId === selectedPrimaryTargetId,
  );
  const selectedMechanismIds = getTaskSelectedMechanismIds(editableTask);
  const selectedPartInstanceIds = getTaskSelectedPartInstanceIds(editableTask);
  const getMechanismLabel = (mechanism: BootstrapPayload["mechanisms"][number]) =>
    `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`;
  const getPartInstanceLabel = (partInstance: BootstrapPayload["partInstances"][number]) => {
    const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
    const partDefinitionLabel = partDefinition
      ? `${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)})`
      : null;

    return partDefinitionLabel
      ? `${partInstance.name} (${partDefinitionLabel})`
      : partInstance.name;
  };
  const disciplineText = editableTask.disciplineId ? availableDisciplines.find((discipline) => discipline.id === editableTask.disciplineId)?.name ?? "Not set" : "Not set";
  const getStableToneClassName = (value: string) => {
    const filterToneClasses = [
      "filter-tone-info",
      "filter-tone-success",
      "filter-tone-warning",
      "filter-tone-danger",
      "filter-tone-neutral",
    ] as const;
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return filterToneClasses[hash % filterToneClasses.length];
  };
  const getDisciplineOptionToneClassName = (option: { id: string }) => getStableToneClassName(option.id);
  const getSubsystemOptionToneClassName = (option: { id: string }) => getStableToneClassName(option.id);
  const disciplineToneClassName = editableTask.disciplineId
    ? getDisciplineOptionToneClassName({ id: editableTask.disciplineId })
    : "filter-tone-neutral";
  const disciplinePillClassName = `pill task-detail-discipline-pill ${disciplineToneClassName}`;
  const subsystemToneClassName = selectedPrimaryTargetId
    ? getSubsystemOptionToneClassName({ id: selectedPrimaryTargetId })
    : "filter-tone-neutral";
  const subsystemPillClassName = `pill task-detail-subsystem-pill ${subsystemToneClassName}`;
  const subsystemNames = getTaskSelectedPrimaryTargetId(editableTask)
    ? selectedPrimaryTarget
      ? [`${selectedPrimaryTarget.name} (${formatIterationVersion(selectedPrimaryTarget.iteration)})`]
      : []
    : [];
  const mechanismNames = selectedMechanismIds
    .map((mechanismId) => mechanismsById[mechanismId])
    .filter((mechanism): mechanism is BootstrapPayload["mechanisms"][number] => Boolean(mechanism))
    .map(getMechanismLabel);
  const partLabels = selectedPartInstanceIds
    .map((partInstanceId) => partInstancesById[partInstanceId])
    .filter((partInstance): partInstance is BootstrapPayload["partInstances"][number] => Boolean(partInstance))
    .map(getPartInstanceLabel);
  const partsText = partLabels.length > 0 ? partLabels.join(", ") : "No part linked";

  return (
    <details className="task-details-section-collapse modal-wide">
      <summary className="task-details-section-title task-details-section-summary">
        <span>Advanced</span>
      </summary>
      <div className="task-details-section-grid">
        <label className="field task-detail-row">
          <span style={{ color: "var(--text-title)" }}>Discipline</span>
          {canInlineEdit ? (
            editingField === "discipline" ? (
              <FilterDropdown
                allLabel="Not set"
                ariaLabel="Set task discipline"
                buttonInlineEditField="discipline"
                className="task-queue-filter-menu-submenu"
                icon={<IconManufacturing />}
                getOptionToneClassName={getDisciplineOptionToneClassName}
                getSelectedToneClassName={(selection) =>
                  selection[0] ? getDisciplineOptionToneClassName({ id: selection[0] }) : undefined
                }
                singleSelect
                onChange={(selection) => {
                  setTaskDraft?.((current) => ({
                    ...current,
                    disciplineId: selection[0] ?? "",
                  }));
                  setEditingField(null);
                }}
                options={availableDisciplines}
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
                  <span className={disciplinePillClassName}>{disciplineText}</span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </span>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              <span className={disciplinePillClassName}>{disciplineText}</span>
            </p>
          )}
        </label>
        <label className="field task-detail-row">
          <span style={{ color: "var(--text-title)" }}>{subsystemFieldLabel}</span>
          {canInlineEdit ? (
            editingField === "subsystem" ? (
              <FilterDropdown
                allLabel={`No ${subsystemFieldLabel.toLowerCase()} linked`}
                ariaLabel={`Set ${subsystemFieldLabel.toLowerCase()}`}
                buttonInlineEditField="subsystem"
                className="task-queue-filter-menu-submenu"
                icon={<IconManufacturing />}
                getOptionToneClassName={getSubsystemOptionToneClassName}
                getSelectedToneClassName={(selection) =>
                  selection[0] ? getSubsystemOptionToneClassName({ id: selection[0] }) : undefined
                }
                singleSelect
                onChange={(selection) => {
                  setTaskDraft?.((current) =>
                    setTaskPrimaryTargetSelection(current, bootstrap, selection[0] ?? ""),
                  );
                  setEditingField(null);
                }}
                options={primaryTargetNameOptions.map((name) => ({ id: name, name }))}
                value={selectedPrimaryTargetId ? [selectedPrimaryTargetId] : []}
              />
            ) : (
              <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline task-detail-inline-edit-shell-inline-left">
                <button
                  className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                  data-inline-edit-field="subsystem"
                  onClick={() => setEditingField("subsystem")}
                  type="button"
                >
                  <span className={subsystemPillClassName}>
                    {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
                  </span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </span>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              <span className={subsystemPillClassName}>
                {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
              </span>
            </p>
          )}
        </label>
        <label className="field task-detail-row">
          <span style={{ color: "var(--text-title)" }}>Start date</span>
          {canInlineEdit ? (
            editingField === "startDate" ? (
              <input
                aria-label="Start date"
                autoFocus
                className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
                data-inline-edit-field="startDate"
                onBlur={() => setEditingField(null)}
                onChange={(event) => {
                  setTaskDraft?.((current) => ({ ...current, startDate: event.target.value }));
                  setEditingField(null);
                }}
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
        <label className="field modal-wide task-detail-row task-detail-collapsible-field">
          <details className="task-detail-collapsible" onDoubleClick={canInlineEdit ? undefined : openTaskEditModal}>
            <summary className="task-detail-collapsible-summary">
              <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
              <span className="task-detail-copy">{canInlineEdit ? "Mechanism" : "Mechanisms"}</span>
            </summary>
            <div className="task-detail-collapsible-body">
              {canInlineEdit ? (
                editingField === "mechanism" ? (
                  projectMechanisms.length > 0 ? (
                    <FilterDropdown
                      allLabel="No mechanism linked"
                      ariaLabel="Set task mechanisms"
                      buttonInlineEditField="mechanism"
                      className="task-queue-filter-menu-submenu"
                      menuClassName="task-details-blocker-menu-popup"
                      icon={<IconManufacturing />}
                      onChange={(selection) => {
                        setTaskDraft?.((current) => ({
                          ...current,
                          mechanismIds: selection,
                          mechanismId: selection[0] ?? null,
                        }));
                      }}
                      options={projectMechanisms.map((mechanism) => ({
                        id: mechanism.id,
                        name: getMechanismLabel(mechanism),
                      }))}
                      portalMenu
                      value={selectedMechanismIds}
                    />
                  ) : (
                    <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                      No mechanism linked
                    </p>
                  )
                ) : (
                  <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                    <button
                      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                      data-inline-edit-field="mechanism"
                      onClick={() => setEditingField("mechanism")}
                      type="button"
                    >
                      <span className="task-detail-copy">
                        {mechanismNames.length > 0 ? mechanismNames.join(", ") : "No mechanism linked"}
                      </span>
                    </button>
                    <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                  </span>
                )
              ) : mechanismNames.length > 0 ? (
                <div className="task-details-mechanism-list">
                  {mechanismNames.map((mechanismName, index) => (
                    <div className="task-details-mechanism-item" key={`${mechanismName}-${index}`}>
                      <span className="task-detail-ellipsis-reveal" data-full-text={mechanismName}>
                        {mechanismName}
                      </span>
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
        <label className="field modal-wide task-detail-row task-detail-collapsible-field">
          <details className="task-detail-collapsible" onDoubleClick={canInlineEdit ? undefined : openTaskEditModal}>
            <summary className="task-detail-collapsible-summary">
              <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
              <span className="task-detail-copy">Parts</span>
            </summary>
            <div className="task-detail-collapsible-body">
              {canInlineEdit ? (
                editingField === "parts" ? (
                  projectPartInstances.length > 0 ? (
                    <FilterDropdown
                      allLabel="No part linked"
                      ariaLabel="Set task parts"
                      buttonInlineEditField="parts"
                      className="task-queue-filter-menu-submenu"
                      menuClassName="task-details-blocker-menu-popup"
                      icon={<IconParts />}
                      onChange={(selection) => {
                        setTaskDraft?.((current) => ({
                          ...current,
                          partInstanceIds: selection,
                          partInstanceId: selection[0] ?? null,
                        }));
                      }}
                      options={projectPartInstances.map((partInstance) => ({
                        id: partInstance.id,
                        name: getPartInstanceLabel(partInstance),
                      }))}
                      portalMenu
                      value={selectedPartInstanceIds}
                    />
                  ) : (
                    <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                      No part linked
                    </p>
                  )
                ) : (
                  <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                    <button
                      className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                      data-inline-edit-field="parts"
                      onClick={() => setEditingField("parts")}
                      type="button"
                    >
                      <span className="task-detail-copy">{partsText}</span>
                    </button>
                    <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                  </span>
                )
              ) : (
                <p className="task-detail-copy">
                  <span className="task-detail-ellipsis-reveal" data-full-text={partsText}>
                    {partsText}
                  </span>
                </p>
              )}
            </div>
          </details>
        </label>
      </div>
    </details>
  );
}
