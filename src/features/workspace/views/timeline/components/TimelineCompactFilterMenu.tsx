import type { BootstrapPayload } from "@/types/bootstrap";
import { IconManufacturing, IconParts, IconPerson, IconSubsystems, IconTasks } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { FilterDropdown } from "@/features/workspace/shared/filters/FilterDropdown";
import type { FilterSelection } from "@/features/workspace/shared/filters/workspaceFilterUtils";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { TaskCalendarEventType } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import {
  TASK_CALENDAR_EVENT_FILTER_OPTIONS,
  TASK_CALENDAR_SORT_OPTIONS,
  type TaskCalendarSortMode,
} from "@/features/workspace/views/taskCalendar/taskCalendarLayout";

import {
  getTimelineFilterToneClassName,
  getTimelineStatusToneClassName,
  TIMELINE_TASK_PRIORITY_OPTIONS,
  TIMELINE_TASK_STATUS_OPTIONS,
} from "../model/timelineViewFilters";

interface TimelineCompactFilterMenuProps {
  activeFilterCount: number;
  calendarEventFilter: "all" | TaskCalendarEventType;
  calendarSortMode: TaskCalendarSortMode;
  showCalendarFilters: boolean;
  onCalendarEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  onCalendarSortModeChange: (value: TaskCalendarSortMode) => void;
  activePersonFilter: FilterSelection;
  bootstrap: BootstrapPayload;
  disciplineFilter: FilterSelection;
  disciplineFilterOptions: DropdownOption[];
  isAllProjectsView: boolean;
  onChangePersonFilter: (value: FilterSelection) => void;
  priorityFilter: FilterSelection;
  projectFilter: FilterSelection;
  setDisciplineFilter: (value: FilterSelection) => void;
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
  calendarSortMode,
  showCalendarFilters,
  onCalendarEventFilterChange,
  onCalendarSortModeChange,
  activePersonFilter,
  bootstrap,
  disciplineFilter,
  disciplineFilterOptions,
  isAllProjectsView,
  onChangePersonFilter,
  priorityFilter,
  projectFilter,
  setDisciplineFilter,
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
      activeCount={activeFilterCount + (showCalendarFilters ? Number(calendarEventFilter !== "all") + Number(calendarSortMode !== "date") : 0)}
      ariaLabel={showCalendarFilters ? "Schedule filters" : "Timeline filters"}
      buttonLabel="Filters"
      className="materials-filter-menu timeline-roster-filter"
      inlineItems={showCalendarFilters}
      menuTitle={showCalendarFilters ? "Selection" : undefined}
      items={[
        {
          label: "Project",
          hidden: !isAllProjectsView,
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All projects"
              ariaLabel="Filter timeline by project"
              className="task-queue-filter-menu-submenu"
              icon={<IconParts />}
              onChange={setProjectFilter}
              options={bootstrap.projects}
              value={projectFilter}
            />
          ),
        },
        {
          label: "Roster",
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All roster"
              ariaLabel="Filter person"
              className="task-queue-filter-menu-submenu"
              icon={<IconPerson />}
              onChange={onChangePersonFilter}
              options={bootstrap.members}
              value={activePersonFilter}
            />
          ),
        },
        {
          label: "Discipline",
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All disciplines"
              ariaLabel="Filter timeline by discipline"
              className="task-queue-filter-menu-submenu"
              icon={<IconTasks />}
              getOptionToneClassName={(option) => getTimelineFilterToneClassName(option.id)}
              getSelectedToneClassName={(selection) =>
                selection.length === 1 ? getTimelineFilterToneClassName(selection[0]) : undefined
              }
              onChange={setDisciplineFilter}
              options={disciplineFilterOptions}
              value={disciplineFilter}
            />
          ),
        },
        {
          label: "Subsystem",
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All subsystems"
              ariaLabel="Filter timeline by subsystem"
              className="task-queue-filter-menu-submenu"
              icon={<IconSubsystems />}
              getOptionToneClassName={(option) => getTimelineFilterToneClassName(option.id)}
              getSelectedToneClassName={(selection) =>
                selection.length === 1 ? getTimelineFilterToneClassName(selection[0]) : undefined
              }
              onChange={setSubsystemFilter}
              options={subsystemFilterOptions}
              value={subsystemFilter}
            />
          ),
        },
        {
          label: "Status",
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All statuses"
              ariaLabel="Filter timeline by status"
              className="task-queue-filter-menu-submenu"
              icon={<IconTasks />}
              getOptionToneClassName={(option) => getTimelineStatusToneClassName(option.id)}
              getSelectedToneClassName={(selection) =>
                selection.length === 1 ? getTimelineStatusToneClassName(selection[0]) : undefined
              }
              onChange={setStatusFilter}
              options={TIMELINE_TASK_STATUS_OPTIONS}
              value={statusFilter}
            />
          ),
        },
        {
          label: "Priority",
          content: (
            <FilterDropdown
              compactSummary={showCalendarFilters}
              allLabel="All priorities"
              ariaLabel="Filter timeline by priority"
              className="task-queue-filter-menu-submenu"
              icon={<IconManufacturing />}
              onChange={setPriorityFilter}
              options={TIMELINE_TASK_PRIORITY_OPTIONS}
              value={priorityFilter}
            />
          ),
        },
        {
          label: "Event type",
          hidden: !showCalendarFilters,
          content: (
            <select
              aria-label="Filter calendar by event type"
              className="task-queue-sort-menu-select"
              onChange={(event) => onCalendarEventFilterChange(event.currentTarget.value as "all" | TaskCalendarEventType)}
              value={calendarEventFilter}
            >
              {TASK_CALENDAR_EVENT_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ),
        },
        {
          label: "Sort by",
          hidden: !showCalendarFilters,
          content: (
            <select
              aria-label="Sort calendar events by"
              className="task-queue-sort-menu-select"
              onChange={(event) => onCalendarSortModeChange(event.currentTarget.value as TaskCalendarSortMode)}
              value={calendarSortMode}
            >
              {TASK_CALENDAR_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}
