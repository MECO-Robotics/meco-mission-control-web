import { useEffect, useLayoutEffect, useMemo, useRef, useState, type UIEvent } from "react";

import { createContinuousCalendarDates } from "./taskCalendarLayout";
import type { TaskCalendarEvent } from "./taskCalendarEvents";
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
  const selectedDayRef = useRef<HTMLElement>(null);
  const cursorDayRef = useRef<HTMLElement>(null);
  const previousStackHeightRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedDateKey) cursorDayRef.current?.scrollIntoView({ block: "start" });
  }, [cursorKey, selectedDateKey]);
  useEffect(() => {
    if (selectedDateKey) selectedDayRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedDateKey]);
  useLayoutEffect(() => {
    const stack = stackRef.current;
    const previousHeight = previousStackHeightRef.current;
    if (stack && previousHeight !== null) {
      stack.scrollTop += stack.scrollHeight - previousHeight;
      previousStackHeightRef.current = null;
    }
  }, [monthsBefore]);
  const calendarDates = useMemo(
    () => createContinuousCalendarDates(
      new Date(cursorYear, cursorMonth - monthsBefore, 1),
      monthsBefore + monthsAfter + 1,
    ),
    [cursorMonth, cursorYear, monthsAfter, monthsBefore],
  );

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
      aria-label="Calendar"
      className="task-calendar-month-stack"
      onScroll={appendMonthsWhenNearEnd}
      ref={stackRef}
      role="region"
      tabIndex={0}
    >
      <div className="task-calendar-frame">
        <TaskCalendarMonthGrid
          eventsByDateKey={eventsByDateKey}
          monthCells={calendarDates}
          onOpenDay={onOpenDay}
          onOpenEvent={onOpenEvent}
          selectedDateKey={selectedDateKey}
          todayDateKey={todayDateKey}
          onCloseSelectedDay={onCloseSelectedDay}
          dayRef={(dateKey, element) => {
            if (dateKey === selectedDateKey) selectedDayRef.current = element;
            if (dateKey === `${cursorYear}-${String(cursorMonth + 1).padStart(2, "0")}-01`) {
              cursorDayRef.current = element;
            }
          }}
        />
      </div>
    </div>
  );
}
