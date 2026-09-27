import type { BootstrapPayload } from "@/types/bootstrap";
import { IconManufacturing, IconParts, IconPerson, IconTasks } from "@/components/shared/Icons";
import {
  CompactFilterMenu,
  compactFilterDropdownMenuItem,
} from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TASK_PRIORITY_OPTIONS } from "@/features/workspace/shared/model/workspaceOptions";
import { TASK_QUEUE_STATUS_OPTIONS } from "./taskQueueKanbanBoardState";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";

import {
  getTaskQueueFilterToneClassName,
  getTaskQueueStatusToneClassName,
} from "./taskQueueViewState";

interface TaskQueueCompactFilterMenuProps {
  activeFilterCount: number;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplineOptions: DropdownOption[];
  isAllProjectsView: boolean;
  ownerFilter: FilterSelection;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  setDisciplineFilter: (value: FilterSelection) => void;
  setOwnerFilter: (value: FilterSelection) => void;
  setPriorityFilter: (value: FilterSelection) => void;
  setProjectFilter: (value: FilterSelection) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setSubsystemFilter: (value: FilterSelection) => void;
  setSubsystemIterationFilter: (value: FilterSelection) => void;
  showSubsystemIterationFilter: boolean;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
  subsystemIterationFilter: FilterSelection;
  subsystemIterationOptions: DropdownOption[];
}

export function TaskQueueCompactFilterMenu({
  activeFilterCount,
  bootstrap,
  disciplineFilter,
  disciplineOptions,
  isAllProjectsView,
  ownerFilter,
  priorityFilter,
  projectFilter,
  setDisciplineFilter,
  setOwnerFilter,
  setPriorityFilter,
  setProjectFilter,
  setStatusFilter,
  setSubsystemFilter,
  setSubsystemIterationFilter,
  showSubsystemIterationFilter,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
  subsystemIterationFilter,
  subsystemIterationOptions,
}: TaskQueueCompactFilterMenuProps) {
  return (
    <CompactFilterMenu
      activeCount={activeFilterCount}
      ariaLabel="Task filters"
      buttonLabel="Filters"
      className="task-queue-filter-menu"
      items={[
        compactFilterDropdownMenuItem({
          allLabel: "All projects",
          ariaLabel: "Filter tasks by project",
          label: "Project",
          hidden: !isAllProjectsView,
          icon: <IconParts />,
          onChange: setProjectFilter,
          options: bootstrap.projects,
          value: projectFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All disciplines",
          ariaLabel: "Filter tasks by discipline",
          label: "Discipline",
          icon: <IconTasks />,
          getOptionToneClassName: (option) => getTaskQueueFilterToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTaskQueueFilterToneClassName(selection[0]) : undefined,
          onChange: setDisciplineFilter,
          options: disciplineOptions,
          value: disciplineFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All subsystems",
          ariaLabel: "Filter tasks by subsystem",
          label: "Subsystem",
          icon: <IconManufacturing />,
          getOptionToneClassName: (option) => getTaskQueueFilterToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTaskQueueFilterToneClassName(selection[0]) : undefined,
          onChange: setSubsystemFilter,
          options: subsystemFilterOptions,
          value: subsystemFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All iterations",
          ariaLabel: "Filter tasks by subsystem iteration",
          label: "Iteration",
          hidden: !showSubsystemIterationFilter,
          icon: <IconManufacturing />,
          onChange: setSubsystemIterationFilter,
          options: subsystemIterationOptions,
          value: subsystemIterationFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All assignees",
          ariaLabel: "Filter tasks by assigned student",
          label: "Assignee",
          icon: <IconPerson />,
          onChange: setOwnerFilter,
          options: bootstrap.members,
          value: ownerFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All statuses",
          ariaLabel: "Filter tasks by status",
          label: "Status",
          icon: <IconTasks />,
          getOptionToneClassName: (option) => getTaskQueueStatusToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTaskQueueStatusToneClassName(selection[0]) : undefined,
          onChange: setStatusFilter,
          options: TASK_QUEUE_STATUS_OPTIONS,
          value: statusFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All priorities",
          ariaLabel: "Filter tasks by priority",
          label: "Priority",
          icon: <IconTasks />,
          onChange: setPriorityFilter,
          options: TASK_PRIORITY_OPTIONS,
          value: priorityFilter,
        }),
      ]}
    />
  );
}
