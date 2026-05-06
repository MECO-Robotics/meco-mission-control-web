import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskPayload } from "@/types/payloads";
import type { TaskRecord } from "@/types/recordsExecution";
import { formatIterationVersion } from "@/lib/appUtils/common";
import { TASK_PRIORITY_OPTIONS } from "../../../../shared/model/workspaceOptions";
import {
  getTaskPrimaryTargetNameOptions,
  getTaskSelectedAssigneeIds,
  getTaskSelectedPrimaryTargetId,
  getTaskTargetGroupLabel,
  setTaskPrimaryTargetSelection,
} from "../../../../shared/task/taskTargeting";
import type { TaskDetailsEditableField } from "../../taskModalTypes";
import { getStableToneClassName } from "./taskDetailsOverviewTone";

interface UseTaskDetailsOverviewModelArgs {
  activeTask: TaskRecord;
  bootstrap: BootstrapPayload;
  setEditingField: Dispatch<SetStateAction<TaskDetailsEditableField | null>>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

export function useTaskDetailsOverviewModel({
  activeTask,
  bootstrap,
  setEditingField,
  setTaskDraft,
  taskDraft,
}: UseTaskDetailsOverviewModelArgs) {
  const editableTask = taskDraft ?? activeTask;
  const selectedProject =
    bootstrap.projects.find((project) => project.id === editableTask.projectId) ?? null;
  const targetGroupLabel = getTaskTargetGroupLabel(selectedProject);
  const subsystemFieldLabel = targetGroupLabel === "Subsystems" ? "Subsystem" : "Workstream";
  const membersById = Object.fromEntries(
    bootstrap.members.map((member) => [member.id, member] as const),
  ) as Record<string, BootstrapPayload["members"][number]>;
  const subsystemsById = Object.fromEntries(
    bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem] as const),
  ) as Record<string, BootstrapPayload["subsystems"][number]>;
  const selectedAssigneeIds = getTaskSelectedAssigneeIds(editableTask);
  const priorityText = taskDraft?.priority ?? activeTask.priority;
  const priorityPillClassName = `pill priority-${priorityText}`;
  const selectedPrimaryTargetId = getTaskSelectedPrimaryTargetId(editableTask);
  const projectSubsystems = bootstrap.subsystems
    .filter((subsystem) => subsystem.projectId === editableTask.projectId)
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.iteration - right.iteration,
    );
  const primaryTargetNameOptions = getTaskPrimaryTargetNameOptions(projectSubsystems);
  const selectedPrimaryTarget = selectedPrimaryTargetId
    ? subsystemsById[selectedPrimaryTargetId] ?? null
    : null;
  const ownerIdText = taskDraft?.ownerId ?? activeTask.ownerId ?? "";
  const ownerText = ownerIdText ? membersById[ownerIdText]?.name ?? "Unknown" : "Unassigned";
  const mentorIdText = taskDraft?.mentorId ?? activeTask.mentorId ?? "";
  const mentorText = mentorIdText ? membersById[mentorIdText]?.name ?? "Unknown" : "Unassigned";
  const ownerName = editableTask.ownerId
    ? membersById[editableTask.ownerId]?.name ?? "Unknown"
    : "Unassigned";
  const mentorName = editableTask.mentorId
    ? membersById[editableTask.mentorId]?.name ?? "Unknown"
    : "Unassigned";
  const subsystemText = selectedPrimaryTargetId
    ? selectedPrimaryTarget
      ? `${selectedPrimaryTarget.name} (${formatIterationVersion(selectedPrimaryTarget.iteration)})`
      : "No subsystem linked"
    : "No subsystem linked";
  const assigneeNames = selectedAssigneeIds
    .map((memberId) => membersById[memberId]?.name)
    .filter((name): name is string => Boolean(name));
  const editableMentorOptions = Object.values(membersById).filter(
    (member) => member.role === "mentor",
  );
  const editableMemberOptions = Object.values(membersById).filter(
    (member) => member.role === "student",
  );
  const getSubsystemOptionToneClassName = (option: { id: string }) =>
    getStableToneClassName(option.id);
  const subsystemToneClassName = selectedPrimaryTargetId
    ? getSubsystemOptionToneClassName({ id: selectedPrimaryTargetId })
    : "filter-tone-neutral";
  const subsystemPillClassName = `pill task-detail-subsystem-pill ${subsystemToneClassName}`;
  const subsystemPillStyle = {
    "--task-detail-pill-accent": selectedPrimaryTarget?.color ?? undefined,
  } as CSSProperties;

  const setSummary = (summary: string) => {
    setTaskDraft?.((current) => ({ ...current, summary }));
  };

  const setPriority = (priority: TaskPayload["priority"]) => {
    setTaskDraft?.((current) => ({ ...current, priority }));
  };

  const handleSubsystemChange = (selection: string[]) => {
    setTaskDraft?.((current) =>
      setTaskPrimaryTargetSelection(current, bootstrap, selection[0] ?? ""),
    );
    setEditingField(null);
  };

  const handleOwnerChange = (selection: string[]) => {
    const ownerId = selection[0] ?? null;
    setTaskDraft?.((current) => ({
      ...current,
      ownerId,
      assigneeIds: ownerId
        ? Array.from(new Set([...current.assigneeIds, ownerId]))
        : current.assigneeIds,
    }));
    setEditingField(null);
  };

  const handleAssignedChange = (selection: string[]) => {
    // Owner should remain assigned when present so owner/assignee views stay aligned.
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
  };

  const handleMentorChange = (selection: string[]) => {
    setTaskDraft?.((current) => ({
      ...current,
      mentorId: selection[0] ?? null,
    }));
    setEditingField(null);
  };

  return {
    assigneeNames,
    editableMemberOptions,
    editableMentorOptions,
    editableTask,
    handleAssignedChange,
    handleMentorChange,
    handleOwnerChange,
    handleSubsystemChange,
    mentorIdText,
    mentorName,
    mentorText,
    ownerIdText,
    ownerName,
    ownerText,
    primaryTargetNameOptions,
    priorityPillClassName,
    priorityText,
    selectedAssigneeIds,
    selectedPrimaryTargetId,
    setPriority,
    setSummary,
    subsystemFieldLabel,
    subsystemPillClassName,
    subsystemPillStyle,
    subsystemText,
    getSubsystemOptionToneClassName,
    taskSummary: taskDraft?.summary ?? activeTask.summary,
    taskPriorityOptions: TASK_PRIORITY_OPTIONS,
  };
}

export type TaskDetailsOverviewModel = ReturnType<typeof useTaskDetailsOverviewModel>;
