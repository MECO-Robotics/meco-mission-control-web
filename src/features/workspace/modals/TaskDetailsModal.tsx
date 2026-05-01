import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload, TaskRecord } from "@/types";
import type { TaskBlockerDraft, TaskBlockerType } from "@/types";
import { formatIterationVersion } from "@/lib/appUtils";
import {
  EditableHoverIndicator,
  FilterDropdown,
  getStatusPillClassName,
} from "@/features/workspace/shared";
import {
  formatTaskStatusLabel,
  TASK_PRIORITY_OPTIONS,
} from "@/features/workspace/shared/workspaceOptions";
import { getTaskOpenBlockersForTask } from "@/features/workspace/shared/taskPlanning";
import { getTimelineTaskStatusSignal } from "@/features/workspace/views/timeline";
import { TimelineTaskStatusLogo } from "@/features/workspace/views/timeline/TimelineTaskStatusLogo";
import {
  IconManufacturing,
  IconParts,
  IconPerson,
  IconTasks,
} from "@/components/shared";
import {
  getProjectTaskTargetLabel,
  setTaskPrimaryTargetSelection,
} from "@/lib/appUtils";
import { getTaskDisciplinesForProject } from "@/lib/taskDisciplines";
import type { TimelineTaskStatusSignal } from "@/features/workspace/views/timeline/timelineGridBodyUtils";

interface TaskDetailsModalProps {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  closeTaskDetailsModal: () => void;
  footerActions?: ReactNode;
  headerTitle?: ReactNode;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
  onEditTask: (task: TaskRecord) => void;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  showEditButton?: boolean;
}

function formatTaskDetailDate(dateValue: string): string {
  if (!dateValue) {
    return "Not set";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString();
}

function isTaskDetailDateOverdue(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() < today.getTime();
}

function isTaskDetailDateToday(dateValue: string): boolean {
  if (!dateValue) {
    return false;
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return parsedDate.getTime() === today.getTime();
}

function TaskDetailsStatusIcon({
  label,
  signal,
  status,
}: {
  label: string;
  signal: TimelineTaskStatusSignal;
  status: TaskRecord["status"];
}) {
  return (
    <span aria-label={label} className={`task-detail-header-status task-detail-header-status-signal-${signal}`} title={label}>
      <span className="task-detail-header-status-icon">
        <TimelineTaskStatusLogo signal={signal} status={status} />
      </span>
      <span className="task-detail-header-status-caption">{label}</span>
    </span>
  );
}

export function TaskDetailsModal({
  activeTask,
  bootstrap,
  closeTaskDetailsModal,
  footerActions,
  headerTitle,
  setTaskDraft,
  taskDraft,
  onEditTask,
  onResolveTaskBlocker,
  showEditButton = true,
}: TaskDetailsModalProps) {
  type EditableField =
    | "title"
    | "summary"
    | "priority"
    | "owner"
    | "assigned"
    | "mentor"
    | "dueDate"
    | "targetEvent"
    | "discipline"
    | "subsystem"
    | "mechanism"
    | "parts";
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const membersById = Object.fromEntries(
    bootstrap.members.map((member) => [member.id, member]),
  ) as Record<string, BootstrapPayload["members"][number]>;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem]),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const mechanismsById = Object.fromEntries(
    bootstrap.mechanisms.map((mechanism) => [mechanism.id, mechanism]),
  ) as Record<string, BootstrapPayload["mechanisms"][number]>;
  const partInstancesById = Object.fromEntries(
    bootstrap.partInstances.map((partInstance) => [partInstance.id, partInstance]),
  ) as Record<string, BootstrapPayload["partInstances"][number]>;
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition]),
  ) as Record<string, BootstrapPayload["partDefinitions"][number]>;
  const disciplinesById = Object.fromEntries(
    bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
  ) as Record<string, BootstrapPayload["disciplines"][number]>;
  const eventsById = Object.fromEntries(
    bootstrap.events.map((event) => [event.id, event]),
  ) as Record<string, BootstrapPayload["events"][number]>;
  const editableTask = taskDraft ?? activeTask;
  const selectedProject = bootstrap.projects.find((project) => project.id === editableTask.projectId) ?? null;
  const availableDisciplines = getTaskDisciplinesForProject(selectedProject);
  const targetGroupLabel = getProjectTaskTargetLabel(selectedProject);
  const subsystemFieldLabel = targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream";
  const projectSubsystems = [...bootstrap.subsystems]
    .filter((subsystem) => subsystem.projectId === editableTask.projectId)
    .sort((left, right) => left.name.localeCompare(right.name) || left.iteration - right.iteration);
  const selectedSubsystemIds =
    editableTask.subsystemIds.length > 0
      ? editableTask.subsystemIds
      : editableTask.subsystemId
        ? [editableTask.subsystemId]
        : [];
  const selectedPrimaryTargetId = selectedSubsystemIds[0] ?? "";
  const projectMechanisms = bootstrap.mechanisms.filter(
    (mechanism) => mechanism.subsystemId === selectedPrimaryTargetId,
  );
  const projectPartInstances = bootstrap.partInstances.filter(
    (partInstance) => partInstance.subsystemId === selectedPrimaryTargetId,
  );
  const selectedAssigneeIds = taskDraft
    ? taskDraft.assigneeIds.length > 0
      ? taskDraft.assigneeIds
      : taskDraft.ownerId
        ? [taskDraft.ownerId]
        : []
    : activeTask.assigneeIds.length > 0
      ? activeTask.assigneeIds
      : activeTask.ownerId
        ? [activeTask.ownerId]
        : [];
  const subsystemNames = selectedSubsystemIds
    .map((subsystemId) => {
      const subsystem = subsystemsById[subsystemId];
      return subsystem
        ? `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`
        : null;
    })
    .filter((name): name is string => Boolean(name));
  const selectedMechanismIds =
    editableTask.mechanismIds.length > 0
      ? editableTask.mechanismIds
      : editableTask.mechanismId
        ? [editableTask.mechanismId]
        : [];
  const mechanismNames = selectedMechanismIds
    .map((mechanismId) => {
      const mechanism = mechanismsById[mechanismId];
      return mechanism
        ? `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`
        : null;
    })
    .filter((name): name is string => Boolean(name));
  const selectedPartInstanceIds =
    editableTask.partInstanceIds.length > 0
      ? editableTask.partInstanceIds
      : editableTask.partInstanceId
        ? [editableTask.partInstanceId]
        : [];
  const partLabels = selectedPartInstanceIds
    .map((partInstanceId) => {
      const partInstance = partInstancesById[partInstanceId];
      if (!partInstance) {
        return null;
      }

      const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
      return partDefinition
        ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
        : partInstance.name;
    })
    .filter((label): label is string => Boolean(label));
  const assigneeNames = selectedAssigneeIds
    .map((memberId) => membersById[memberId]?.name)
    .filter((name): name is string => Boolean(name));
  const ownerName = editableTask.ownerId ? membersById[editableTask.ownerId]?.name ?? "Unknown" : "Unassigned";
  const mentorName = editableTask.mentorId ? membersById[editableTask.mentorId]?.name ?? "Unknown" : "Unassigned";
  const linkedEvent =
    editableTask.targetEventId && eventsById[editableTask.targetEventId]
      ? eventsById[editableTask.targetEventId]
      : null;
  const openBlockers = getTaskOpenBlockersForTask(activeTask.id, bootstrap);
  const blockerTaskNamesById = new Map(
    bootstrap.tasks.map((task) => [task.id, task.title] as const),
  );
  const openBlockerRows = openBlockers.map((blocker) => {
    const blockerTaskName =
      blocker.blockerType === "task" && blocker.blockerId
        ? blockerTaskNamesById.get(blocker.blockerId) ?? "Unknown task"
        : null;

    return {
      ...blocker,
      blockerTaskName,
    };
  });
  const isOverdue = isTaskDetailDateOverdue(editableTask.dueDate);
  const isBlockedByDependency = openBlockers.length > 0;
  const priorityText = taskDraft?.priority ?? activeTask.priority;
  const ownerIdText = taskDraft?.ownerId ?? activeTask.ownerId ?? "";
  const ownerText = ownerIdText ? membersById[ownerIdText]?.name ?? "Unknown" : "Unassigned";
  const mentorIdText = taskDraft?.mentorId ?? activeTask.mentorId ?? "";
  const mentorText = mentorIdText ? membersById[mentorIdText]?.name ?? "Unknown" : "Unassigned";
  const statusText = taskDraft?.status ?? activeTask.status;
  const statusPreviewTask = taskDraft ? { ...activeTask, status: statusText } : activeTask;
  const detailStatusSignal = getTimelineTaskStatusSignal(statusPreviewTask, bootstrap);
  const detailStatusLabel = isBlockedByDependency ? "Blocked" : formatTaskStatusLabel(statusText);
  const priorityPillClassName = getStatusPillClassName(priorityText);
  const editableMentorOptions = Object.values(membersById).filter((member) => member.role === "mentor");
  const editableStudentOptions = Object.values(membersById).filter((member) => member.role === "student");
  const editableMemberOptions = editableStudentOptions;
  const estimatedHours = Number(activeTask.estimatedHours);
  const actualHours = Number(activeTask.actualHours);
  const dueDateText = formatTaskDetailDate(editableTask.dueDate);
  const dueDatePillClassName = editableTask.dueDate
    ? statusText === "complete"
      ? "pill task-detail-deadline-pill task-detail-deadline-pill-success"
      : isOverdue
        ? "pill task-detail-deadline-pill task-detail-deadline-pill-danger"
        : isTaskDetailDateToday(editableTask.dueDate)
          ? "pill task-detail-deadline-pill task-detail-deadline-pill-warning"
          : "pill task-detail-deadline-pill task-detail-deadline-pill-success"
    : "pill status-pill status-pill-neutral";
  const loggedHoursClassName =
    estimatedHours > 0
      ? actualHours === 0
        ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
        : actualHours <= estimatedHours
          ? "pill task-detail-hours-pill task-detail-hours-pill-success"
          : actualHours < estimatedHours * 1.5
            ? "pill task-detail-hours-pill task-detail-hours-pill-warning"
            : "pill task-detail-hours-pill task-detail-hours-pill-danger"
      : "pill task-detail-hours-pill task-detail-hours-pill-neutral";
  const partsText = partLabels.length > 0 ? partLabels.join(", ") : "No part linked";
  const canInlineEdit = Boolean(taskDraft && setTaskDraft);
  const titleText = taskDraft?.title ?? activeTask.title;
  const summaryText = taskDraft?.summary ?? activeTask.summary;
  const disciplineText = editableTask.disciplineId ? disciplinesById[editableTask.disciplineId]?.name ?? "Not set" : "Not set";
  const targetEventText = linkedEvent ? linkedEvent.title : "No target milestone";
  const priorityOptions = TASK_PRIORITY_OPTIONS;
  const ownerOptions = editableMemberOptions;
  const mentorOptions = editableMentorOptions;
  const assigneeOptions = editableMemberOptions;
  const disciplineOptions = availableDisciplines;
  const subsystemOptions = projectSubsystems.map((subsystem) => ({
    id: subsystem.id,
    name: `${subsystem.name} (${formatIterationVersion(subsystem.iteration)})`,
  }));
  const targetEventOptions = bootstrap.events.map((event) => ({
    id: event.id,
    name: event.title,
  }));
  const mechanismOptions = projectMechanisms.map((mechanism) => ({
    id: mechanism.id,
    name: `${mechanism.name} (${formatIterationVersion(mechanism.iteration)})`,
  }));
  const partOptions = projectPartInstances.map((partInstance) => {
    const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
    const label = partDefinition
      ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
      : partInstance.name;

    return {
      id: partInstance.id,
      name: label,
    };
  });
  const blockerDrafts = taskDraft?.taskBlockers ?? [];
  const blockerTypeOptions: Array<{ id: TaskBlockerType; name: string }> = [
    { id: "task", name: "Task dependency" },
    { id: "part_instance", name: "Part" },
    { id: "event", name: "Milestone" },
    { id: "external", name: "Other" },
  ];
  const filterToneClasses = [
    "filter-tone-info",
    "filter-tone-success",
    "filter-tone-warning",
    "filter-tone-danger",
    "filter-tone-neutral",
  ] as const;
  const getStableToneClassName = (value: string) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return filterToneClasses[hash % filterToneClasses.length];
  };
  const getPriorityToneClassName = (priority: string) => {
    switch (priority) {
      case "critical":
        return "filter-tone-danger";
      case "high":
        return "filter-tone-warning";
      case "medium":
        return "filter-tone-neutral";
      case "low":
        return "filter-tone-success";
      default:
        return "filter-tone-neutral";
    }
  };
  const getPriorityOptionToneClassName = (option: { id: string }) =>
    getPriorityToneClassName(option.id);
  const getDisciplineOptionToneClassName = (option: { id: string }) =>
    getStableToneClassName(option.id);
  const getSubsystemOptionToneClassName = (option: { id: string }) =>
    getStableToneClassName(option.id);
  const blockerTaskOptions = bootstrap.tasks
    .filter((task) => task.projectId === editableTask.projectId && task.id !== activeTask.id)
    .map((task) => ({
      id: task.id,
      name: task.title,
    }));
  const blockerEventOptions = bootstrap.events.map((event) => ({
    id: event.id,
    name: event.title,
  }));
  const getBlockerDescription = (blocker: TaskBlockerDraft) => {
    switch (blocker.blockerType) {
      case "task":
        return blocker.blockerId
          ? `Waiting on task: ${blockerTaskOptions.find((option) => option.id === blocker.blockerId)?.name ?? "Unknown task"}`
          : "Waiting on task";
      case "part_instance":
        return blocker.blockerId
          ? `Waiting on part: ${partOptions.find((option) => option.id === blocker.blockerId)?.name ?? "Unknown part"}`
          : "Waiting on part";
      case "event":
        return blocker.blockerId
          ? `Waiting on milestone: ${blockerEventOptions.find((option) => option.id === blocker.blockerId)?.name ?? "Unknown milestone"}`
          : "Waiting on milestone";
      default:
        return blocker.description.trim();
    }
  };
  const addBlockerDraft = (blockerType: TaskBlockerType) => {
    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: [
        ...(current.taskBlockers ?? []),
        {
          blockerType,
          blockerId: null,
          description:
            blockerType === "task"
              ? "Waiting on task"
              : blockerType === "part_instance"
                ? "Waiting on part"
                : blockerType === "event"
                  ? "Waiting on milestone"
                  : "",
          severity: "medium",
        },
      ],
    }));
  };
  const updateBlockerDraft = (index: number, updates: Partial<TaskBlockerDraft>) => {
    setTaskDraft?.((current) => {
      const nextBlockers = [...(current.taskBlockers ?? [])];
      const existingBlocker = nextBlockers[index];
      if (!existingBlocker) {
        return current;
      }

      nextBlockers[index] = {
        ...existingBlocker,
        ...updates,
      };

      return {
        ...current,
        taskBlockers: nextBlockers,
      };
    });
  };
  const updateBlockerType = (index: number, blockerType: TaskBlockerType) => {
    updateBlockerDraft(index, {
      blockerType,
      blockerId: null,
      description:
        blockerType === "task"
          ? "Waiting on task"
          : blockerType === "part_instance"
            ? "Waiting on part"
            : blockerType === "event"
              ? "Waiting on milestone"
              : "",
    });
  };
  const updateBlockerTarget = (index: number, blockerId: string | null) => {
    const blocker = blockerDrafts[index];
    if (!blocker) {
      return;
    }

    updateBlockerDraft(index, {
      blockerId,
      description: getBlockerDescription({ ...blocker, blockerId }),
    });
  };
  const removeBlockerDraft = (index: number) => {
    setTaskDraft?.((current) => ({
      ...current,
      taskBlockers: (current.taskBlockers ?? []).filter(
        (_blocker, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  useEffect(() => {
    setEditingField(null);
  }, [activeTask.id]);

  const openTaskEditModal = () => onEditTask(activeTask);

  return (
    <div className="modal-scrim" role="presentation" style={{ zIndex: 2000 }}>
      <section
        aria-modal="true"
        className="modal-card task-details-modal"
        role="dialog"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border-base)" }}
      >
        <div className="panel-header compact-header task-details-header">
          <div>
            <p className="eyebrow" style={{ color: "var(--meco-blue)" }}>
              {canInlineEdit ? "Edit Task Details" : "View Task Details"}
            </p>
            <div className="task-detail-header-title-row">
              <div className="task-detail-header-title-stack">
                <div className="task-detail-header-title-main">
                  {canInlineEdit ? (
                    editingField === "title" ? (
                      <div className="task-detail-inline-edit-title-shell task-detail-inline-edit-title-shell-editing">
                        <h2>{titleText}</h2>
                        <input
                          aria-label="Task title"
                          autoFocus
                          className="task-detail-inline-edit-input task-detail-inline-edit-input-title"
                          data-inline-edit-field="title"
                          onBlur={() => setEditingField(null)}
                          onChange={(event) =>
                            setTaskDraft?.((current) => ({ ...current, title: event.target.value }))
                          }
                          required
                          value={titleText}
                        />
                      </div>
                    ) : (
                      <div className="task-detail-inline-edit-title-shell">
                        <h2>{titleText}</h2>
                        <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator task-detail-inline-edit-indicator-title" />
                        <button
                          aria-label="Edit task title"
                          className="task-detail-inline-edit-hitarea"
                          data-inline-edit-field="title"
                          onClick={() => setEditingField("title")}
                          type="button"
                        />
                      </div>
                    )
                  ) : (
                    <div onDoubleClick={openTaskEditModal}>
                      {headerTitle ?? <h2 style={{ color: "var(--text-title)" }}>{activeTask.title}</h2>}
                    </div>
                  )}
                </div>
                <div className="task-detail-copy task-detail-header-meta-line">
                  {canInlineEdit ? (
                    editingField === "dueDate" ? (
                      <input
                        aria-label="Due date"
                        autoFocus
                        className="task-detail-inline-edit-input task-detail-inline-edit-input-date"
                        data-inline-edit-field="dueDate"
                        onBlur={() => setEditingField(null)}
                        onChange={(event) => {
                          setTaskDraft?.((current) => ({ ...current, dueDate: event.target.value }));
                          setEditingField(null);
                        }}
                        type="date"
                        value={editableTask.dueDate}
                      />
                    ) : (
                      <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                        <button
                          className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                          data-inline-edit-field="dueDate"
                          onClick={() => setEditingField("dueDate")}
                          type="button"
                        >
                          <span className={dueDatePillClassName}>{dueDateText}</span>
                        </button>
                        <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                      </span>
                    )
                  ) : (
                    <span className={dueDatePillClassName} onDoubleClick={openTaskEditModal}>
                      {dueDateText}
                    </span>
                  )}
                  <span style={{ color: "var(--text-copy)" }}> {"->"} </span>
                  {canInlineEdit ? (
                  editingField === "targetEvent" ? (
                      <FilterDropdown
                        allLabel="No target milestone"
                        ariaLabel="Set target milestone"
                        buttonInlineEditField="targetEvent"
                        className="task-queue-filter-menu-submenu"
                        icon={<IconTasks />}
                        singleSelect
                        onChange={(selection) => {
                          setTaskDraft?.((current) => ({
                            ...current,
                            targetEventId: selection[0] ?? null,
                          }));
                          setEditingField(null);
                        }}
                        options={targetEventOptions}
                        value={editableTask.targetEventId ? [editableTask.targetEventId] : []}
                      />
                    ) : (
                      <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                        <button
                          className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                          data-inline-edit-field="targetEvent"
                          onClick={() => setEditingField("targetEvent")}
                          type="button"
                        >
                          <span>{targetEventText}</span>
                        </button>
                        <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                      </span>
                    )
                  ) : (
                    <span onDoubleClick={openTaskEditModal}>{targetEventText}</span>
                  )}
                </div>
              </div>
              <div className="task-detail-header-side-stack">
                <TaskDetailsStatusIcon label={detailStatusLabel} signal={detailStatusSignal} status={statusText} />
                <span className="task-detail-header-hours-inline task-detail-header-hours-right">
                  <span className="task-detail-header-hours-label">Logged:</span>
                  <span className={loggedHoursClassName}>{actualHours}h</span>
                  <span className="task-detail-hour-separator">/</span>
                  <span className="task-detail-hours-estimate">{estimatedHours}h</span>
                </span>
              </div>
            </div>
          </div>
          <div className="panel-actions">
            <button
              className="icon-button task-details-close-button"
              onClick={closeTaskDetailsModal}
              type="button"
              aria-label="Close task details"
            >
              {"\u00D7"}
            </button>
          </div>
        </div>

        <div className="modal-form task-details-grid" style={{ color: "var(--text-copy)" }}>
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
                  value={summaryText}
                />
              ) : (
                <div className="task-detail-inline-edit-shell">
                  <button
                    className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-summary"
                    data-inline-edit-field="summary"
                    onClick={() => setEditingField("summary")}
                    type="button"
                  >
                    <p className="task-detail-copy">{summaryText || "No summary provided."}</p>
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
                      getOptionToneClassName={getPriorityOptionToneClassName}
                      getSelectedToneClassName={(selection) =>
                        selection[0] ? getPriorityToneClassName(selection[0]) : undefined
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
                    options={priorityOptions}
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
            <label className="field task-detail-row task-details-overview-owner">
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
                    options={ownerOptions}
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
                    className="task-queue-filter-menu-submenu"
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
                    }}
                    options={assigneeOptions}
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
                            <span className="task-detail-ellipsis-reveal" data-full-text={assigneeName}>
                              {assigneeName}
                            </span>
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
                        <span className="task-detail-ellipsis-reveal" data-full-text={assigneeName}>
                          {assigneeName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="task-details-assigned-empty">Unassigned</div>
                  )}
                </div>
              )}
            </div>
            <label className="field task-detail-row task-details-overview-mentor">
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
                    options={mentorOptions}
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
                      icon={<IconTasks />}
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
                      options={disciplineOptions}
                      value={editableTask.disciplineId ? [editableTask.disciplineId] : []}
                    />
                  ) : (
                    <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                      <button
                        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                        data-inline-edit-field="discipline"
                        onClick={() => setEditingField("discipline")}
                        type="button"
                      >
                        <span className="task-detail-copy">{disciplineText}</span>
                      </button>
                      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                    </span>
                  )
                ) : (
                  <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
                    {disciplineText}
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
                      options={subsystemOptions}
                      value={selectedPrimaryTargetId ? [selectedPrimaryTargetId] : []}
                    />
                  ) : (
                    <span className="task-detail-inline-edit-shell task-detail-inline-edit-shell-inline">
                      <button
                        className="task-detail-inline-edit-trigger task-detail-inline-edit-trigger-inline"
                        data-inline-edit-field="subsystem"
                        onClick={() => setEditingField("subsystem")}
                        type="button"
                      >
                        <span className="task-detail-copy">
                          {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
                        </span>
                      </button>
                      <EditableHoverIndicator className="editable-hover-indicator-inline task-detail-inline-edit-indicator" />
                    </span>
                  )
                ) : (
                  <p className="task-detail-copy" onDoubleClick={openTaskEditModal}>
                    {subsystemNames.length > 0 ? subsystemNames.join(", ") : "No subsystem linked"}
                  </p>
                )}
              </label>
              <label className="field modal-wide task-detail-row">
                {canInlineEdit ? <span style={{ color: "var(--text-title)" }}>Mechanism</span> : null}
                {canInlineEdit ? (
                  editingField === "mechanism" ? (
                    projectMechanisms.length > 0 ? (
                      <FilterDropdown
                        allLabel="No mechanism linked"
                        ariaLabel="Set task mechanisms"
                        buttonInlineEditField="mechanism"
                        className="task-queue-filter-menu-submenu"
                        icon={<IconManufacturing />}
                        onChange={(selection) => {
                          setTaskDraft?.((current) => ({
                            ...current,
                            mechanismIds: selection,
                            mechanismId: selection[0] ?? null,
                          }));
                        }}
                        options={mechanismOptions}
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
                ) : (
                  <details className="task-detail-collapsible" onDoubleClick={openTaskEditModal}>
                    <summary className="task-detail-collapsible-summary">
                      <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                      <span className="task-detail-copy">Mechanisms</span>
                    </summary>
                    <div className="task-detail-collapsible-body">
                      {mechanismNames.length > 0 ? (
                        <div className="task-details-mechanism-list">
                          {mechanismNames.map((mechanismName, index) => (
                            <div className="task-details-mechanism-item" key={`${mechanismName}-${index}`}>
                              <span
                                className="task-detail-ellipsis-reveal"
                                data-full-text={mechanismName}
                              >
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
                )}
              </label>
              <label className="field modal-wide task-detail-row">
                {canInlineEdit ? <span style={{ color: "var(--text-title)" }}>Parts</span> : null}
                {canInlineEdit ? (
                  editingField === "parts" ? (
                    projectPartInstances.length > 0 ? (
                      <FilterDropdown
                        allLabel="No part linked"
                        ariaLabel="Set task parts"
                        buttonInlineEditField="parts"
                        className="task-queue-filter-menu-submenu"
                        icon={<IconParts />}
                        onChange={(selection) => {
                          setTaskDraft?.((current) => ({
                            ...current,
                            partInstanceIds: selection,
                            partInstanceId: selection[0] ?? null,
                          }));
                        }}
                        options={partOptions}
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
                  <details className="task-detail-collapsible" onDoubleClick={openTaskEditModal}>
                    <summary className="task-detail-collapsible-summary">
                      <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                      <span className="task-detail-copy">Parts</span>
                    </summary>
                    <div className="task-detail-collapsible-body">
                      <p className="task-detail-copy">
                        <span className="task-detail-ellipsis-reveal" data-full-text={partsText}>
                          {partsText}
                        </span>
                      </p>
                    </div>
                  </details>
                )}
              </label>
              <div className="field modal-wide task-detail-list-shell task-detail-collapsible-field">
                <details className="task-detail-collapsible" open={canInlineEdit}>
                  <summary className="task-detail-collapsible-summary">
                    <span className="task-detail-collapsible-icon" aria-hidden="true"></span>
                    <span className="task-detail-copy">Blockers</span>
                  </summary>
                  <div className="task-detail-collapsible-body">
                    {canInlineEdit ? (
                      <div className="task-details-blocker-editor">
                        {blockerDrafts.length > 0 ? (
                          blockerDrafts.map((blocker, index) => (
                            <div className="task-details-blocker-editor-row" key={blocker.id ?? `blocker-${index}`}>
                              <FilterDropdown
                                allLabel="Type"
                                ariaLabel="Set blocker type"
                                buttonInlineEditField={`blocker-type-${index}`}
                                className="task-queue-filter-menu-submenu task-details-blocker-type-menu"
                                icon={<IconTasks />}
                                portalMenu
                                onChange={(selection) => {
                                  const nextType = (selection[0] as TaskBlockerType | undefined) ?? "external";
                                  updateBlockerType(index, nextType);
                                }}
                                options={blockerTypeOptions}
                                singleSelect
                                value={[blocker.blockerType]}
                              />
                              {blocker.blockerType === "task" ? (
                                <FilterDropdown
                                  allLabel="Select task"
                                  ariaLabel="Set blocker task"
                                  buttonInlineEditField={`blocker-target-${index}`}
                                  className="task-queue-filter-menu-submenu task-details-blocker-target-menu"
                                  icon={<IconTasks />}
                                  portalMenu
                                  onChange={(selection) => updateBlockerTarget(index, selection[0] ?? null)}
                                  options={blockerTaskOptions}
                                  singleSelect
                                  value={blocker.blockerId ? [blocker.blockerId] : []}
                                />
                              ) : blocker.blockerType === "part_instance" ? (
                                <FilterDropdown
                                  allLabel="Select part"
                                  ariaLabel="Set blocker part"
                                  buttonInlineEditField={`blocker-target-${index}`}
                                  className="task-queue-filter-menu-submenu task-details-blocker-target-menu"
                                  icon={<IconParts />}
                                  portalMenu
                                  onChange={(selection) => updateBlockerTarget(index, selection[0] ?? null)}
                                  options={partOptions}
                                  singleSelect
                                  value={blocker.blockerId ? [blocker.blockerId] : []}
                                />
                              ) : blocker.blockerType === "event" ? (
                                <FilterDropdown
                                  allLabel="Select milestone"
                                  ariaLabel="Set blocker milestone"
                                  buttonInlineEditField={`blocker-target-${index}`}
                                  className="task-queue-filter-menu-submenu task-details-blocker-target-menu"
                                  icon={<IconTasks />}
                                  portalMenu
                                  onChange={(selection) => updateBlockerTarget(index, selection[0] ?? null)}
                                  options={blockerEventOptions}
                                  singleSelect
                                  value={blocker.blockerId ? [blocker.blockerId] : []}
                                />
                              ) : (
                                <input
                                  aria-label={`Blocker note ${index + 1}`}
                                  className="task-detail-inline-edit-input task-details-blocker-input"
                                  onChange={(event) =>
                                    updateBlockerDraft(index, { description: event.target.value })
                                  }
                                  placeholder="Describe blocker"
                                  value={blocker.description}
                                />
                              )}
                              <button
                                aria-label={`Remove blocker ${index + 1}`}
                                className="icon-button task-details-blocker-remove-button"
                                onClick={() => removeBlockerDraft(index)}
                                type="button"
                              >
                                {"\u00D7"}
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
                            No blockers yet
                          </p>
                        )}
                        <div className="task-details-blocker-editor-actions">
                          <FilterDropdown
                            allLabel="Add blocker"
                            ariaLabel="Add blocker"
                            buttonInlineEditField="add-blocker"
                            className="task-queue-filter-menu-submenu task-details-blocker-add-menu"
                            menuClassName="task-details-blocker-add-menu-popup"
                            icon={<IconTasks />}
                            portalMenu
                            portalMenuPlacement="below"
                            onChange={(selection) => {
                              const nextType = (selection[0] as TaskBlockerType | undefined) ?? null;
                              if (!nextType) {
                                return;
                              }
                              addBlockerDraft(nextType);
                            }}
                            options={blockerTypeOptions}
                            singleSelect
                            value={[]}
                          />
                        </div>
                      </div>
                    ) : openBlockers.length > 0 ? (
                      <div className="workspace-detail-list task-detail-list" style={{ marginTop: "0.5rem" }}>
                        {openBlockerRows.map((blocker) => (
                          <div className="workspace-detail-list-item task-detail-list-item" key={blocker.id}>
                            <div style={{ minWidth: 0, flex: "1 1 auto", display: "grid", gap: "0.1rem" }}>
                              <strong
                                className="task-detail-ellipsis-reveal"
                                data-full-text={blocker.description}
                                style={{ color: "var(--text-title)" }}
                              >
                                {blocker.description}
                              </strong>
                              <div
                                className="task-detail-ellipsis-reveal"
                                data-full-text={`${blocker.blockerType.replace("_", " ")}${blocker.blockerType === "task" && blocker.blockerTaskName ? ` - ${blocker.blockerTaskName}` : ""}${blocker.severity ? ` - ${blocker.severity}` : ""}`}
                                style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}
                              >
                                {blocker.blockerType.replace("_", " ")}
                                {blocker.blockerType === "task" && blocker.blockerTaskName
                                  ? ` - ${blocker.blockerTaskName}`
                                  : ""}
                                {blocker.severity ? ` - ${blocker.severity}` : ""}
                              </div>
                            </div>
                            <button
                              className="secondary-action"
                              onClick={() => void onResolveTaskBlocker(blocker.id)}
                              type="button"
                            >
                              Resolve
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>None</p>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </details>

          <div className="modal-actions modal-wide">
            {footerActions}
            {showEditButton ? (
              <button
                className="primary-action task-details-edit-button"
                data-tutorial-target="timeline-edit-task-button"
                onClick={() => onEditTask(activeTask)}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path
                    d="M11.854 1.646a.5.5 0 0 1 .707 0l1.793 1.793a.5.5 0 0 1 0 .707l-8.52 8.52-3.183.71.71-3.183 8.493-8.547ZM3.74 10.995l1.265-.282 7.574-7.6-1.06-1.06-7.6 7.574-.179.81ZM2 13.5h12a.5.5 0 0 1 0 1H2a.5.5 0 0 1 0-1Z"
                    fill="currentColor"
                  />
                </svg>
                Edit task
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
