import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";

import { createMonthCells } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";
import { TaskCalendarMonthGrid } from "./TaskCalendarMonthGrid";

const MONTHS_PER_APPEND = 6;
const INITIAL_MONTHS = 12;

export function TaskCalendarMonthStack({
  eventsByDateKey,
  monthCursor,
  onOpenDay,
  onOpenEvent,
  onCloseSelectedDay,
  selectedDateKey,
  todayDateKey,
}: {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCursor: Date;
  onOpenDay: (dateKey: string) => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  onCloseSelectedDay: () => void;
  selectedDateKey: string | null;
  todayDateKey: string;
}) {
  const cursorYear = monthCursor.getFullYear();
  const cursorMonth = monthCursor.getMonth();
  const cursorKey = `${cursorYear}-${cursorMonth}`;
  const [monthWindow, setMonthWindow] = useState({ cursorKey, count: INITIAL_MONTHS });
  const monthCount = monthWindow.cursorKey === cursorKey ? monthWindow.count : INITIAL_MONTHS;
  const stackRef = useRef<HTMLDivElement>(null);
  const selectedMonthRef = useRef<HTMLElement>(null);
  useEffect(() => {
    stackRef.current?.scrollTo({ top: 0 });
  }, [cursorMonth, cursorYear]);
  useEffect(() => {
    selectedMonthRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedDateKey]);
  const months = useMemo(
    () => Array.from(
      { length: monthCount },
      (_, index) => new Date(cursorYear, cursorMonth + index, 1),
    ),
    [cursorMonth, cursorYear, monthCount],
  );
  const monthViews = useMemo(() => months.map((month) => ({
    cells: createMonthCells(month),
    key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
    label: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    month,
  })), [months]);

  const appendMonthsWhenNearEnd = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 240) {
      setMonthWindow((current) => ({
        cursorKey,
        count: (current.cursorKey === cursorKey ? current.count : INITIAL_MONTHS) + MONTHS_PER_APPEND,
      }));
    }
  };

  return (
    <div
      aria-label="Calendar months"
      className="task-calendar-month-stack"
      onScroll={appendMonthsWhenNearEnd}
      ref={stackRef}
      role="region"
      tabIndex={0}
    >
      {monthViews.map(({ cells, key: monthKey, label: monthLabel, month }) => {
        const isSelectedMonth = selectedDateKey?.startsWith(monthKey) ?? false;
        return (
          <section
            aria-label={monthLabel}
            className="task-calendar-month-section"
            key={monthKey}
            ref={isSelectedMonth ? selectedMonthRef : undefined}
          >
            <h3>{monthLabel}</h3>
            <div className="task-calendar-frame">
              <TaskCalendarMonthGrid
                eventsByDateKey={eventsByDateKey}
                monthCells={cells}
                monthCursor={month}
                onOpenDay={onOpenDay}
                onOpenEvent={onOpenEvent}
                selectedDateKey={selectedDateKey}
                todayDateKey={todayDateKey}
                showAdjacentDates={false}
              />
            </div>
            {isSelectedMonth && selectedDateKey ? (
              <TaskCalendarDayDetails
                dateKey={selectedDateKey}
                events={eventsByDateKey.get(selectedDateKey) ?? []}
                onClose={onCloseSelectedDay}
                onOpenEvent={onOpenEvent}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
