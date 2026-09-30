import type { BootstrapPayload } from "@/types/bootstrap";
import { CalendarDays } from "lucide-react";
import { IconManufacturing, IconParts, IconPerson, IconSubsystems, IconTasks } from "@/components/shared/Icons";
import {
  CompactFilterMenu,
  compactFilterDropdownMenuItem,
} from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { TASK_CALENDAR_EVENT_FILTER_OPTIONS } from "@/features/workspace/views/taskCalendar/taskCalendarLayout";

import {
  getTimelineFilterToneClassName,
  getTimelineStatusToneClassName,
  TIMELINE_TASK_PRIORITY_OPTIONS,
  TIMELINE_TASK_STATUS_OPTIONS,
} from "../model/timelineViewFilters";

interface TimelineCompactFilterMenuProps {
  activeFilterCount: number;
  calendarEventFilter: "all" | TaskCalendarEventType;
  showCalendarFilters: boolean;
  onCalendarEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  workTypeFilter: FilterSelection;
  workTypeFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onChangePersonFilter: (value: FilterSelection) => void;
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
  calendarEventFilter,
  showCalendarFilters,
  onCalendarEventFilterChange,
  activePersonFilter,
  bootstrap,
  workTypeFilter,
  workTypeFilterOptions,
  isAllProjectsView,
  onChangePersonFilter,
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
      activeCount={activeFilterCount + (showCalendarFilters ? Number(calendarEventFilter !== "all") : 0)}
      ariaLabel={showCalendarFilters ? "Schedule filters" : "Timeline filters"}
      buttonLabel="Filters"
      className="materials-filter-menu timeline-roster-filter"
      inlineItems={showCalendarFilters}
      items={[
        compactFilterDropdownMenuItem({
          allLabel: "All projects",
          ariaLabel: "Filter timeline by project",
          label: "Project",
          hidden: showCalendarFilters || !isAllProjectsView,
          icon: <IconParts />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
          onChange: setProjectFilter,
          options: bootstrap.projects,
          value: projectFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All roster",
          ariaLabel: "Filter person",
          label: "Roster",
          icon: <IconPerson />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
          onChange: onChangePersonFilter,
          options: bootstrap.members,
          value: activePersonFilter,
        }),
        compactFilterDropdownMenuItem({
          allLabel: "All work types",
          ariaLabel: "Filter timeline by work type",
          label: "Work type",
          hidden: showCalendarFilters,
          icon: <IconTasks />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
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
          hidden: showCalendarFilters,
          icon: <IconSubsystems />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
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
          hidden: showCalendarFilters,
          icon: <IconTasks />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
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
          hidden: showCalendarFilters,
          icon: <IconManufacturing />,
          compactSummary: showCalendarFilters,
          hideButtonIcon: showCalendarFilters,
          onChange: setPriorityFilter,
          options: TIMELINE_TASK_PRIORITY_OPTIONS,
          value: priorityFilter,
        }),
        {
          label: "Event type",
          hidden: !showCalendarFilters,
          icon: <CalendarDays size={14} />,
          content: (
            <FilterDropdown
              compactSummary
              hideButtonIcon
              allLabel="All events"
              ariaLabel="Filter calendar by event type"
              icon={<CalendarDays size={14} />}
              onChange={(value) => onCalendarEventFilterChange((value[0] as TaskCalendarEventType | undefined) ?? "all")}
              options={TASK_CALENDAR_EVENT_FILTER_OPTIONS.filter((option) => option.value !== "all").map((option) => ({ id: option.value, name: option.label }))}
              singleSelect
              value={calendarEventFilter === "all" ? [] : [calendarEventFilter]}
            />
          ),
        },
      ]}
    />
  );
}
