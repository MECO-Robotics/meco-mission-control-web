import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import { EditableHoverIndicator, FilterDropdown } from "../../shared/WorkspaceViewShared";
import { getStatusPillClassName } from "../../shared/model";
import { TASK_PRIORITY_OPTIONS } from "../../shared/model";
import {
  getTaskPrimaryTargetNameOptions,
  getTaskSelectedAssigneeIds,
  getTaskSelectedPrimaryTargetId,
  getTaskTargetGroupLabel,
  setTaskPrimaryTargetSelection,
} from "../../shared/task/taskTargeting";
import type { TaskDetailsEditableField } from "./taskModalTypes";
import { IconManufacturing, IconPerson, IconTasks } from "@/components/shared/Icons";
import { formatIterationVersion } from "@/lib/appUtils";
import { TaskDetailReveal } from "./details/TaskDetailReveal";

interface TaskDetailsOverviewSectionProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  editingField: TaskDetailsEditableField | null;
  openTaskEditModal: () => void;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function TaskDetailsOverviewSection({
  activeTask,
  bootstrap,
  canInlineEdit,
  editingField,
  openTaskEditModal,
  setEditingField,
  setTaskDraft,
  taskDraft,
}: TaskDetailsOverviewSectionProps) {
  const editableTask = taskDraft ?? activeTask;
  const selectedProject =
    bootstrap.projects.find((project) => project.id === editableTask.projectId) ?? null;
  const membersById = Object.fromEntries(
    bootstrap.members.map((member) => [member.id, member]),
  ) as Record<string, BootstrapPayload["members"][number]>;
  const targetGroupLabel = getTaskTargetGroupLabel(selectedProject);
  const subsystemFieldLabel = targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream";
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const selectedAssigneeIds = getTaskSelectedAssigneeIds(editableTask);
  const priorityText = taskDraft?.priority ?? activeTask.priority;
  const priorityPillClassName = getStatusPillClassName(priorityText);
  const selectedPrimaryTargetId = getTaskSelectedPrimaryTargetId(editableTask);
  const projectSubsystems = bootstrap.subsystems
    .filter((subsystem) => subsystem.projectId === editableTask.projectId)
    .sort((left, right) => left.name.localeCompare(right.name) || left.iteration - right.iteration);
  const primaryTargetNameOptions = getTaskPrimaryTargetNameOptions(projectSubsystems);
  const selectedPrimaryTarget = selectedPrimaryTargetId
    ? subsystemsById[selectedPrimaryTargetId] ?? null
    : null;
  const ownerIdText = taskDraft?.ownerId ?? activeTask.ownerId ?? "";
  const ownerText = ownerIdText ? membersById[ownerIdText]?.name ?? "Unknown" : "Unassigned";
  const mentorIdText = taskDraft?.mentorId ?? activeTask.mentorId ?? "";
  const mentorText = mentorIdText ? membersById[mentorIdText]?.name ?? "Unknown" : "Unassigned";
  const ownerName = editableTask.ownerId ? membersById[editableTask.ownerId]?.name ?? "Unknown" : "Unassigned";
  const mentorName = editableTask.mentorId ? membersById[editableTask.mentorId]?.name ?? "Unknown" : "Unassigned";
  const subsystemText = selectedPrimaryTargetId
    ? selectedPrimaryTarget
      ? `${selectedPrimaryTarget.name} (${formatIterationVersion(selectedPrimaryTarget.iteration)})`
      : "No subsystem linked"
    : "No subsystem linked";
  const assigneeNames = selectedAssigneeIds
    .map((memberId) => membersById[memberId]?.name)
    .filter((name): name is string => Boolean(name));
  const editableMentorOptions = Object.values(membersById).filter((member) => member.role === "mentor");
  const editableStudentOptions = Object.values(membersById).filter((member) => member.role === "student");
  const editableMemberOptions = editableStudentOptions;
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
  const getSubsystemOptionToneClassName = (option: { id: string }) => getStableToneClassName(option.id);
  const subsystemToneClassName = selectedPrimaryTargetId
    ? getSubsystemOptionToneClassName({ id: selectedPrimaryTargetId })
    : "filter-tone-neutral";
  const subsystemPillClassName = `pill task-detail-subsystem-pill ${subsystemToneClassName}`;
  const subsystemPillStyle = {
    "--task-detail-pill-accent": selectedPrimaryTarget?.color ?? undefined,
  } as CSSProperties;
  const handleSubsystemChange = (selection: string[]) => {
    setTaskDraft?.((current) =>
      setTaskPrimaryTargetSelection(current, bootstrap, selection[0] ?? ""),
    );
    setEditingField(null);
  };

  return (
    <>
      <label className="field task-detail-row modal-wide">
        <span style={{ color: "var(--text-title)" }}>Summary</span>
        {canInlineEdit ? (
          editingField === "summary" ? (
            <textarea
              autoFocus
              className="task-detail-inline-edit-textarea"
              onBlur={() => setEditingField(null)}
              onChange={(event) =>
                setTaskDraft?.((current) => ({ ...current, summary: event.target.value }))
              }
              value={taskDraft?.summary ?? activeTask.summary}
            />
          ) : (
            <div className="task-detail-inline-edit-shell">
              <button
                className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
                data-inline-edit-field="summary"
                onClick={() => setEditingField("summary")}
                type="button"
              >
                <p className="task-detail-copy">{(taskDraft?.summary ?? activeTask.summary) || "No summary provided."}</p>
              </button>
              <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
            </div>
          )
        ) : (
          <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
            {activeTask.summary || "No summary provided."}
          </p>
        )}
      </label>
      <div className="task-details-section-grid task-details-overview-grid modal-wide">
        <label className="field task-detail-row task-detail-row-chip task-details-overview-priority">
          <span style={{ color: "var(--text-title)" }}>Priority</span>
          {canInlineEdit ? (
            editingField === "priority" ? (
              <FilterDropdown
                allLabel="Priority"
                ariaLabel="Set task priority"
                buttonInlineEditField="priority"
                className="task-queue-filter-menu-submenu"
                icon={<IconTasks />}
                getOptionToneClassName={(option) =>
                  option.id === "critical"
                    ? "filter-tone-danger"
                    : option.id === "high"
                      ? "filter-tone-warning"
                      : option.id === "low"
                        ? "filter-tone-success"
                        : "filter-tone-neutral"
                }
                getSelectedToneClassName={(selection) =>
                  selection[0]
                    ? selection[0] === "critical"
                      ? "filter-tone-danger"
                      : selection[0] === "high"
                        ? "filter-tone-warning"
                        : selection[0] === "low"
                          ? "filter-tone-success"
                          : "filter-tone-neutral"
                    : undefined
                }
                singleSelect
                onChange={(selection) => {
                  const nextPriority = selection[0];
                  if (!nextPriority) {
                    return;
                  }
                  setTaskDraft?.((current) => ({
                    ...current,
                    priority: nextPriority as TaskPayload["priority"],
                  }));
                  setEditingField(null);
                }}
                options={TASK_PRIORITY_OPTIONS}
                value={priorityText ? [priorityText] : []}
              />
            ) : (
              <div className="task-detail-inline-edit-shell">
                <button
                  className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-chip"
                  data-inline-edit-field="priority"
                  onClick={() => setEditingField("priority")}
                  type="button"
                >
                  <span className={priorityPillClassName}>{priorityText}</span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </div>
            )
          ) : (
            <span className={priorityPillClassName} onDoubleClick={openTaskEditModal}>
              {priorityText}
            </span>
          )}
        </label>
        <label
          className={`field task-detail-row task-detail-row-chip task-details-overview-subsystem ${
            canInlineEdit ? "task-details-inline-edit-left" : ""
          }`}
        >
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
                  selection[0]
                    ? getSubsystemOptionToneClassName({ id: selection[0] })
                    : undefined
                }
                singleSelect
                onChange={handleSubsystemChange}
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
                  <span className={subsystemPillClassName} style={subsystemPillStyle}>
                    {subsystemText}
                  </span>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </span>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              <span className={subsystemPillClassName} style={subsystemPillStyle}>
                {subsystemText}
              </span>
            </p>
          )}
        </label>
        <label className="field task-details-overview-owner">
          <span style={{ color: "var(--text-title)" }}>Owner</span>
          {canInlineEdit ? (
            editingField === "owner" ? (
              <FilterDropdown
                allLabel="Unassigned"
                ariaLabel="Set task owner"
                buttonInlineEditField="owner"
                className="task-queue-filter-menu-submenu"
                icon={<IconPerson />}
                singleSelect
                onChange={(selection) => {
                  const ownerId = selection[0] ?? null;
                  setTaskDraft?.((current) => ({
                    ...current,
                    ownerId,
                    assigneeIds: ownerId
                      ? Array.from(new Set([...current.assigneeIds, ownerId]))
                      : current.assigneeIds,
                  }));
                  setEditingField(null);
                }}
                options={editableMemberOptions}
                value={ownerIdText ? [ownerIdText] : []}
              />
            ) : (
              <div className="task-detail-inline-edit-shell">
                <button
                  className="task-detail-inline-edit-trigger"
                  data-inline-edit-field="owner"
                  onClick={() => setEditingField("owner")}
                  type="button"
                >
                  <p className="task-detail-copy">{ownerText}</p>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </div>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              {ownerName}
            </p>
          )}
        </label>
        <div className="task-details-overview-assigned">
          <span style={{ color: "var(--text-title)" }}>Assigned</span>
          {canInlineEdit ? (
            editingField === "assigned" ? (
              <FilterDropdown
                allLabel="Unassigned"
                ariaLabel="Set assigned members"
                buttonInlineEditField="assigned"
                className="task-queue-filter-menu-submenu task-details-assigned-list"
                buttonContent={
                  assigneeNames.length > 0 ? (
                    <>
                      {assigneeNames.map((assigneeName, index) => (
                        <div className="task-details-assigned-item" key={`${assigneeName}-${index}`}>
                          <TaskDetailReveal
                            className="task-detail-ellipsis-reveal"
                            text={assigneeName}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="task-details-assigned-empty">Unassigned</div>
                  )
                }
                icon={<IconPerson />}
                onChange={(selection) => {
                  setTaskDraft?.((current) => ({
                    ...current,
                    assigneeIds: Array.from(
                      new Set(
                        [...selection, current.ownerId].filter(
                          (memberId): memberId is string => Boolean(memberId),
                        ),
                      ),
                    ),
                  }));
                  setEditingField(null);
                }}
                options={editableMemberOptions}
                value={selectedAssigneeIds}
              />
            ) : (
              <div className="task-detail-inline-edit-shell">
                <button
                  className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-assigned task-details-assigned-list"
                  data-inline-edit-field="assigned"
                  onClick={() => setEditingField("assigned")}
                  type="button"
                >
                  {assigneeNames.length > 0 ? (
                    assigneeNames.map((assigneeName, index) => (
                      <div className="task-details-assigned-item" key={`${assigneeName}-${index}`}>
                        <TaskDetailReveal
                          className="task-detail-ellipsis-reveal"
                          text={assigneeName}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="task-details-assigned-empty">Unassigned</div>
                  )}
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </div>
            )
          ) : (
            <div className="task-details-assigned-list" onDoubleClick={openTaskEditModal}>
              {assigneeNames.length > 0 ? (
                assigneeNames.map((assigneeName, index) => (
                  <div className="task-details-assigned-item" key={`${assigneeName}-${index}`}>
                    <TaskDetailReveal className="task-detail-ellipsis-reveal" text={assigneeName} />
                  </div>
                ))
              ) : (
                <div className="task-details-assigned-empty">Unassigned</div>
              )}
            </div>
          )}
        </div>
        <label className="field task-details-overview-mentor">
          <span style={{ color: "var(--text-title)" }}>Mentor</span>
          {canInlineEdit ? (
            editingField === "mentor" ? (
              <FilterDropdown
                allLabel="Unassigned"
                ariaLabel="Set mentor"
                buttonInlineEditField="mentor"
                className="task-queue-filter-menu-submenu"
                icon={<IconPerson />}
                singleSelect
                onChange={(selection) => {
                  setTaskDraft?.((current) => ({
                    ...current,
                    mentorId: selection[0] ?? null,
                  }));
                  setEditingField(null);
                }}
                options={editableMentorOptions}
                value={mentorIdText ? [mentorIdText] : []}
              />
            ) : (
              <div className="task-detail-inline-edit-shell">
                <button
                  className="task-detail-inline-edit-trigger"
                  data-inline-edit-field="mentor"
                  onClick={() => setEditingField("mentor")}
                  type="button"
                >
                  <p className="task-detail-copy">{mentorText}</p>
                </button>
                <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
              </div>
            )
          ) : (
            <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
              {mentorName}
            </p>
          )}
        </label>
      </div>
    </>
  );
}

