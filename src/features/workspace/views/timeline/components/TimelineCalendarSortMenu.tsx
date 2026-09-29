import { IconSort } from "@/components/shared/Icons";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { SortDirectionToggle } from "@/features/workspace/shared/filters/SortDirectionToggle";
import {
  TASK_CALENDAR_SORT_OPTIONS,
  type TaskCalendarSortMode,
} from "@/features/workspace/views/taskCalendar/taskCalendarLayout";

export function TimelineCalendarSortMenu({
  onChange,
  direction,
  onDirectionChange,
  sortMode,
}: {
  onChange: (value: TaskCalendarSortMode) => void;
  direction: "asc" | "desc";
  onDirectionChange: (value: "asc" | "desc") => void;
  sortMode: TaskCalendarSortMode;
}) {
  return (
    <CompactFilterMenu
      activeCount={sortMode !== "date" || direction !== "asc" ? 1 : 0}
      ariaLabel="Sort calendar events"
      buttonLabel="Sort"
      className="task-queue-sort-menu"
      icon={<IconSort />}
      items={[
        {
          label: "Sort by",
          labelControl: <SortDirectionToggle direction={direction} label="calendar events" onChange={onDirectionChange} />,
          content: (
            <select
              aria-label="Sort calendar events by"
              className="task-queue-sort-menu-select"
              onChange={(event) => onChange(event.currentTarget.value as TaskCalendarSortMode)}
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
  );
}
