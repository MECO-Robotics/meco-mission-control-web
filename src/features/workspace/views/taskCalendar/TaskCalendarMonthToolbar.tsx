import type { Dispatch, SetStateAction } from "react";

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
      <div className="task-calendar-toolbar-actions">
        <button
          className="secondary-action"
          onClick={() =>
            changeMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
          }
          type="button"
        >
          Prev
        </button>
        <button
          className="secondary-action"
          onClick={() =>
            changeMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
          }
          type="button"
        >
          Next
        </button>
        <button
          className="secondary-action"
          onClick={() => {
            const now = new Date();
            changeMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
          type="button"
        >
          Today
        </button>
      </div>
      <div className="task-calendar-toolbar-center">
        <strong className="task-calendar-toolbar-title">{monthLabel}</strong>
        <TaskCalendarLegend />
      </div>
    </div>
  );
}
