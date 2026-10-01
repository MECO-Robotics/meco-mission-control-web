import { useEffect, useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";

import { createMonthCells } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
import { TaskCalendarDayDetails } from "./TaskCalendarDayDetails";
import { TaskCalendarMonthGrid } from "./TaskCalendarMonthGrid";

const MONTHS_PER_APPEND = 6;
const INITIAL_MONTHS_EACH_DIRECTION = 12;

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
  const [monthWindow, setMonthWindow] = useState({
    cursorKey,
    monthsBefore: INITIAL_MONTHS_EACH_DIRECTION,
    monthsAfter: INITIAL_MONTHS_EACH_DIRECTION,
  });
  const monthsBefore = monthWindow.cursorKey === cursorKey ? monthWindow.monthsBefore : INITIAL_MONTHS_EACH_DIRECTION;
  const monthsAfter = monthWindow.cursorKey === cursorKey ? monthWindow.monthsAfter : INITIAL_MONTHS_EACH_DIRECTION;
  const stackRef = useRef<HTMLDivElement>(null);
  const selectedMonthRef = useRef<HTMLElement>(null);
  const cursorMonthRef = useRef<HTMLElement>(null);
  const previousStackHeightRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedDateKey) cursorMonthRef.current?.scrollIntoView({ block: "start" });
  }, [cursorKey, selectedDateKey]);
  useEffect(() => {
    selectedMonthRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedDateKey]);
  useLayoutEffect(() => {
    const stack = stackRef.current;
    const previousHeight = previousStackHeightRef.current;
    if (stack && previousHeight !== null) {
      stack.scrollTop += stack.scrollHeight - previousHeight;
      previousStackHeightRef.current = null;
    }
  }, [monthsBefore]);
  const months = useMemo(
    () => Array.from({ length: monthsBefore + monthsAfter + 1 }, (_, index) =>
      new Date(cursorYear, cursorMonth + index - monthsBefore, 1)),
    [cursorMonth, cursorYear, monthsAfter, monthsBefore],
  );
  const monthViews = useMemo(() => months.map((month) => ({
    cells: createMonthCells(month),
    key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
    label: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    month,
  })), [months]);

  const appendMonthsWhenNearEnd = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    if (container.scrollTop <= 160 && previousStackHeightRef.current === null) {
      previousStackHeightRef.current = container.scrollHeight;
      setMonthWindow((current) => ({
        cursorKey,
        monthsBefore: (current.cursorKey === cursorKey ? current.monthsBefore : INITIAL_MONTHS_EACH_DIRECTION) + MONTHS_PER_APPEND,
        monthsAfter: current.cursorKey === cursorKey ? current.monthsAfter : INITIAL_MONTHS_EACH_DIRECTION,
      }));
    }
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 240) {
      setMonthWindow((current) => ({
        cursorKey,
        monthsBefore: current.cursorKey === cursorKey ? current.monthsBefore : INITIAL_MONTHS_EACH_DIRECTION,
        monthsAfter: (current.cursorKey === cursorKey ? current.monthsAfter : INITIAL_MONTHS_EACH_DIRECTION) + MONTHS_PER_APPEND,
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
            ref={(element) => {
              if (isSelectedMonth) selectedMonthRef.current = element;
              if (month.getFullYear() === cursorYear && month.getMonth() === cursorMonth) cursorMonthRef.current = element;
            }}
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
