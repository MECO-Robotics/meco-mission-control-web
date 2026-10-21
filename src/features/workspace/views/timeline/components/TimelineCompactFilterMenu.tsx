import type { BootstrapPayload } from "@/types/bootstrap";
import { Users } from "lucide-react";
import { IconManufacturing, IconParts, IconPerson, IconSubsystems, IconTasks } from "@/components/shared/Icons";
import {
  CompactFilterMenu,
  compactFilterDropdownMenuItem,
} from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";

import {
  getTimelineFilterToneClassName,
  getTimelineStatusToneClassName,
  TIMELINE_TASK_PRIORITY_OPTIONS,
  TIMELINE_TASK_STATUS_OPTIONS,
} from "../model/timelineViewFilters";

interface TimelineCompactFilterMenuProps {
  activeFilterCount: number;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  workTypeFilter: FilterSelection;
  workTypeFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onChangePersonFilter: (value: FilterSelection) => void;
  responsibleGroupFilter: FilterSelection;
  setResponsibleGroupFilter: (value: FilterSelection) => void;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  setWorkTypeFilter: (value: FilterSelection) => void;
  setPriorityFilter: (value: FilterSelection) => void;
  setProjectFilter: (value: FilterSelection) => void;
  setStatusFilter: (value: FilterSelection) => void;
  setSubsystemFilter: (value: FilterSelection) => void;
  statusFilter: FilterSelection;
  subsystemFilter: FilterSelection;
  subsystemFilterOptions: DropdownOption[];
}

export function TimelineCompactFilterMenu({
  activeFilterCount,
  activePersonFilter,
  bootstrap,
  workTypeFilter,
  workTypeFilterOptions,
  isAllProjectsView,
  onChangePersonFilter,
  responsibleGroupFilter,
  setResponsibleGroupFilter,
  priorityFilter,
  projectFilter,
  setWorkTypeFilter,
  setPriorityFilter,
  setProjectFilter,
  setStatusFilter,
  setSubsystemFilter,
  statusFilter,
  subsystemFilter,
  subsystemFilterOptions,
}: TimelineCompactFilterMenuProps) {
  return (
    <CompactFilterMenu
      activeCount={activeFilterCount}
      ariaLabel="Schedule filters"
      buttonLabel="Filters"
      className="materials-filter-menu timeline-roster-filter"
      items={[
        compactFilterDropdownMenuItem({
          allLabel: "All projects",
          ariaLabel: "Filter timeline by project",
          label: "Project",
          hidden: !isAllProjectsView,
          icon: <IconParts />,
          onChange: setProjectFilter,
          options: bootstrap.projects,
          value: projectFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All people",
          ariaLabel: "Filter person",
          label: "Person",
          icon: <IconPerson />,
          onChange: onChangePersonFilter,
          options: bootstrap.members,
          value: activePersonFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All work types",
          ariaLabel: "Filter timeline by work type",
          label: "Work type",
          icon: <IconTasks />,
          getOptionToneClassName: (option) => getTimelineFilterToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTimelineFilterToneClassName(selection[0]) : undefined,
          onChange: setWorkTypeFilter,
          options: workTypeFilterOptions,
          value: workTypeFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All subsystems",
          ariaLabel: "Filter timeline by subsystem",
          label: "Subsystem",
          icon: <IconSubsystems />,
          getOptionToneClassName: (option) => getTimelineFilterToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTimelineFilterToneClassName(selection[0]) : undefined,
          onChange: setSubsystemFilter,
          options: subsystemFilterOptions,
          value: subsystemFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All statuses",
          ariaLabel: "Filter timeline by status",
          label: "Status",
          icon: <IconTasks />,
          getOptionToneClassName: (option) => getTimelineStatusToneClassName(option.id),
          getSelectedToneClassName: (selection) =>
            selection.length === 1 ? getTimelineStatusToneClassName(selection[0]) : undefined,
          onChange: setStatusFilter,
          options: TIMELINE_TASK_STATUS_OPTIONS,
          value: statusFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All priorities",
          ariaLabel: "Filter timeline by priority",
          label: "Priority",
          icon: <IconManufacturing />,
          onChange: setPriorityFilter,
          options: TIMELINE_TASK_PRIORITY_OPTIONS,
          value: priorityFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All teams",
          ariaLabel: "Filter schedule by responsible team",
          label: "Team",
          icon: <Users size={14} />,
          onChange: setResponsibleGroupFilter,
          options: bootstrap.responsibleGroups,
          value: responsibleGroupFilter,
        }),
      ]}
    />
  );
}
