import type { Dispatch, SetStateAction } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { TaskCalendarLegend } from "./TaskCalendarLegend";

interface TaskCalendarMonthToolbarProps {
  monthLabel: string;
  onMonthChange: () => void;
  setMonthCursor: Dispatch<SetStateAction<Date>>;
}

export function TaskCalendarMonthToolbar({
  monthLabel,
  onMonthChange,
  setMonthCursor,
}: TaskCalendarMonthToolbarProps) {
  const changeMonth = (nextMonth: SetStateAction<Date>) => {
    onMonthChange();
    setMonthCursor(nextMonth);
  };

  return (
    <div className="task-calendar-toolbar">
      <div aria-label="Calendar month navigation" className="task-calendar-month-controls" role="group">
        <button
          aria-label="Previous month"
          className="icon-button task-calendar-month-button"
          onClick={() =>
            changeMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
          }
          title="Previous month"
          type="button"
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
        <strong className="task-calendar-toolbar-title">{monthLabel}</strong>
        <button
          aria-label="Next month"
          className="icon-button task-calendar-month-button"
          onClick={() =>
            changeMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
          }
          title="Next month"
          type="button"
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>
        <button
          className="secondary-action task-calendar-today-button"
          onClick={() => {
            const now = new Date();
            changeMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
          title="Jump to current month"
          type="button"
        >
          <CalendarDays size={13} strokeWidth={2} />
          Today
        </button>
      </div>
      <TaskCalendarLegend />
    </div>
  );
}
