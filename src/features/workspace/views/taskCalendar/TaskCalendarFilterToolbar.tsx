import { SlidersHorizontal } from "lucide-react";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import type { TaskCalendarEventType } from "./taskCalendarEvents";
import {
  TASK_CALENDAR_EVENT_FILTER_OPTIONS,
  TASK_CALENDAR_SORT_OPTIONS,
  type TaskCalendarSortMode,
} from "./taskCalendarLayout";

interface TaskCalendarFilterToolbarProps {
  eventFilter: "all" | TaskCalendarEventType;
  onEventFilterChange: (value: "all" | TaskCalendarEventType) => void;
  onSortModeChange: (value: TaskCalendarSortMode) => void;
  sortMode: TaskCalendarSortMode;
}

export function TaskCalendarFilterToolbar({
  eventFilter,
  onEventFilterChange,
  onSortModeChange,
  sortMode,
}: TaskCalendarFilterToolbarProps) {
  const filterIsDefault = eventFilter === "all";
  const sortIsDefault = sortMode === "date";
  const activeViewOptionCount = (filterIsDefault ? 0 : 1) + (sortIsDefault ? 0 : 1);

  return (
    <div className="task-queue-toolbar-inline-actions task-calendar-filter-controls">
      <CompactFilterMenu
        activeCount={activeViewOptionCount}
        ariaLabel="Calendar view options"
        buttonLabel="View"
        className="task-queue-filter-menu task-calendar-view-options-menu"
        icon={<SlidersHorizontal size={14} strokeWidth={2} />}
        items={[
          {
            label: "Event type",
            content: (
              <select
                aria-label="Filter calendar by event type"
                className="task-queue-sort-menu-select"
                onChange={(event) =>
                  onEventFilterChange(event.currentTarget.value as "all" | TaskCalendarEventType)
                }
                value={eventFilter}
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
            content: (
              <select
                aria-label="Sort calendar events by"
                className="task-queue-sort-menu-select"
                onChange={(event) => onSortModeChange(event.currentTarget.value as TaskCalendarSortMode)}
                value={sortMode}
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
    </div>
  );
}
