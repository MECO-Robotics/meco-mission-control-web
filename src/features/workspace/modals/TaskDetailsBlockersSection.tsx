import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { BootstrapPayload, TaskPayload } from "@/types";
import type { TaskBlockerDraft, TaskBlockerType } from "@/types";
import { FilterDropdown } from "../shared/WorkspaceViewShared";
import { getTaskOpenBlockersForTask } from "../shared/taskTargeting";
import { TimelineTaskStatusLogo } from "../views/timeline/TimelineTaskStatusLogo";
import { getTimelineTaskStatusSignal } from "../views/timeline/timelineGridBodyUtils";
import { formatIterationVersion } from "@/lib/appUtils";
import { IconParts, IconPerson, IconTasks } from "@/components/shared/Icons";

interface TaskDetailsBlockersSectionProps {
  activeTaskId: string;
  bootstrap: BootstrapPayload;
  canInlineEdit: boolean;
  onResolveTaskBlocker: (blockerId: string) => Promise<void>;
  setTaskDraft?: Dispatch<SetStateAction<TaskPayload>>;
  taskDraft?: TaskPayload;
}

function getBlockerTypeDescription(blockerType: TaskBlockerType) {
  return blockerType === "task"
    ? "Waiting on task"
    : blockerType === "part_instance"
      ? "Waiting on part"
      : blockerType === "event"
        ? "Waiting on milestone"
        : "";
}

export function TaskDetailsBlockersSection({
  activeTaskId,
  bootstrap,
  canInlineEdit,
  onResolveTaskBlocker,
  setTaskDraft,
  taskDraft,
}: TaskDetailsBlockersSectionProps) {
  const blockerDrafts = taskDraft?.taskBlockers ?? [];
  const openBlockers = getTaskOpenBlockersForTask(activeTaskId, bootstrap);
  const tasksById = Object.fromEntries(bootstrap.tasks.map((task) => [task.id, task] as const));
  const partDefinitionsById = Object.fromEntries(
    bootstrap.partDefinitions.map((partDefinition) => [partDefinition.id, partDefinition] as const),
  );
  const selectedSubsystemIds =
    (taskDraft?.subsystemIds?.length ? taskDraft.subsystemIds : taskDraft?.subsystemId ? [taskDraft.subsystemId] : []) ?? [];
  const blockerTaskOptions = bootstrap.tasks
    .filter((task) => {
      if (task.projectId !== taskDraft?.projectId || task.id === activeTaskId) {
        return false;
      }

      const taskSubsystemIds = task.subsystemIds.length > 0 ? task.subsystemIds : task.subsystemId ? [task.subsystemId] : [];
      return taskSubsystemIds.some((subsystemId) => selectedSubsystemIds.includes(subsystemId));
    })
    .map((task) => ({
      id: task.id,
      name: task.title,
      icon: (
        <TimelineTaskStatusLogo
          compact
          signal={getTimelineTaskStatusSignal(task, bootstrap)}
          status={task.status}
        />
      ),
    }));
  const blockerEventOptions = bootstrap.events.map((event) => ({
    id: event.id,
    name: event.title,
  }));
  const partOptions = bootstrap.partInstances.map((partInstance) => {
    const partDefinition = partDefinitionsById[partInstance.partDefinitionId];
    return {
      id: partInstance.id,
      name: partDefinition
        ? `${partInstance.name} (${partDefinition.name} (${formatIterationVersion(partDefinition.iteration)}))`
        : partInstance.name,
    };
  });
  const blockerTypeOptions: Array<{ id: TaskBlockerType; name: string; icon: ReactNode }> = [
    {
      id: "external",
      name: "Other",
      icon: <IconPerson />,
    },
  ];
  const openBlockerRows = openBlockers.map((blocker) => {
    const blockerTaskName =
      blocker.blockerType === "task" && blocker.blockerId
        ? tasksById[blocker.blockerId]?.title ?? "Unknown task"
        : null;

    return {
      ...blocker,
      blockerTaskName,
    };
  });
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
          description: getBlockerTypeDescription(blockerType),
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
      description: getBlockerTypeDescription(blockerType),
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
      taskBlockers: (current.taskBlockers ?? []).filter((_blocker, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <div className="task-detail-blocker-split-column">
      <span style={{ color: "var(--text-title)" }}>Blockers</span>
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
                  menuClassName="task-details-blocker-menu-popup"
                  icon={<IconTasks />}
                  portalMenu
                  onChange={(selection) => {
                    const nextType = selection[0] as TaskBlockerType | undefined;
                    if (!nextType) {
                      return;
                    }
                    updateBlockerType(index, nextType);
                  }}
                  options={blockerTypeOptions}
                  showAllOption={false}
                  singleSelect
                  value={[blocker.blockerType]}
                />
                {blocker.blockerType === "task" ? (
                  <FilterDropdown
                    allLabel="Select task"
                    ariaLabel="Set blocker task"
                    buttonInlineEditField={`blocker-target-${index}`}
                    className="task-queue-filter-menu-submenu task-details-blocker-target-menu"
                    menuClassName="task-details-blocker-menu-popup"
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
                    menuClassName="task-details-blocker-menu-popup"
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
                    menuClassName="task-details-blocker-menu-popup"
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
                    onChange={(event) => updateBlockerDraft(index, { description: event.target.value })}
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
              menuClassName="task-details-blocker-menu-popup task-details-blocker-add-menu-popup"
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
              showAllOption={false}
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
                  data-full-text={`${blocker.blockerType.replace("_", " ")}${blocker.blockerType === "task" && blocker.blockerTaskName ? ` ? ${blocker.blockerTaskName}` : ""}${blocker.severity ? ` ? ${blocker.severity}` : ""}`}
                  style={{ color: "var(--text-copy)", fontSize: "0.8rem" }}
                >
                  {blocker.blockerType.replace("_", " ")}
                  {blocker.blockerType === "task" && blocker.blockerTaskName ? ` ? ${blocker.blockerTaskName}` : ""}
                  {blocker.severity ? ` ? ${blocker.severity}` : ""}
                </div>
              </div>
              <button className="secondary-action" onClick={() => void onResolveTaskBlocker(blocker.id)} type="button">
                Resolve
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="task-detail-copy task-detail-empty" style={{ margin: "0.25rem 0 0" }}>
          None
        </p>
      )}
    </div>
  );
}
