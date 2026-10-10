import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type UIEvent } from "react";

import { createContinuousCalendarDates, getCalendarMonthWeekCount } from "./taskCalendarLayout";
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
  onVisibleMonthChange,
  selectedDateKey,
  todayDateKey,
}: {
  eventsByDateKey: Map<string, TaskCalendarEvent[]>;
  monthCursor: Date;
  onOpenDay: (dateKey: string) => void;
  onOpenEvent: (event: TaskCalendarEvent) => void;
  onCloseSelectedDay: () => void;
  onVisibleMonthChange: (month: Date) => void;
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
  const [stackHeight, setStackHeight] = useState(0);
  const selectedDayRef = useRef<HTMLElement>(null);
  const cursorDayRef = useRef<HTMLElement>(null);
  const scrollUpdatedCursorKeyRef = useRef<string | null>(null);
  const previousStackHeightRef = useRef<number | null>(null);
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const updateHeight = () => setStackHeight(stack.clientHeight);
    updateHeight();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(stack);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (scrollUpdatedCursorKeyRef.current === cursorKey) {
      scrollUpdatedCursorKeyRef.current = null;
      return;
    }
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
  const weekHeight = stackHeight > 0
    ? `${Math.max(0, (stackHeight * 0.95 - 32) / getCalendarMonthWeekCount(monthCursor))}px`
    : undefined;
  const stackStyle = weekHeight
    ? { "--task-calendar-week-height": weekHeight } as CSSProperties
    : undefined;

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
    const stickyHeaderHeight = container.querySelector<HTMLElement>(".task-calendar-weekdays")?.offsetHeight ?? 0;
    const firstUncoveredRowTop = container.getBoundingClientRect().top + stickyHeaderHeight;
    const visibleDay = Array.from(container.querySelectorAll<HTMLElement>(".task-calendar-day[data-date]")).find(
      (day) => day.getBoundingClientRect().top >= firstUncoveredRowTop,
    );
    const visibleDate = visibleDay?.dataset.date;
    if (visibleDate) {
      const [year, month, day] = visibleDate.split("-").map(Number);
      const visibleDayDate = new Date(year, month - 1, day);
      const nextMonthStart = new Date(year, month, 1);
      const daysUntilNextMonth = new Date(year, month, 0).getDate() - day + 1;
      const visibleMonth =
        daysUntilNextMonth <= 6 - visibleDayDate.getDay()
          ? nextMonthStart
          : new Date(year, month - 1, 1);
      const visibleMonthYear = visibleMonth.getFullYear();
      const visibleMonthIndex = visibleMonth.getMonth();
      const visibleMonthKey = `${visibleMonthYear}-${visibleMonthIndex}`;
      if (visibleMonthKey !== cursorKey) {
        const monthDelta = visibleMonthYear * 12 + visibleMonthIndex - (cursorYear * 12 + cursorMonth);
        setMonthWindow((current) => {
          const currentBefore = current.cursorKey === cursorKey ? current.monthsBefore : INITIAL_MONTHS_EACH_DIRECTION;
          const currentAfter = current.cursorKey === cursorKey ? current.monthsAfter : INITIAL_MONTHS_EACH_DIRECTION;
          let nextBefore = currentBefore + monthDelta;
          let nextAfter = currentAfter - monthDelta;
          if (nextBefore < 6) {
            nextAfter += 6 - nextBefore;
            nextBefore = 6;
          }
          if (nextAfter < 6) {
            nextBefore += 6 - nextAfter;
            nextAfter = 6;
          }
          return { cursorKey: visibleMonthKey, monthsBefore: nextBefore, monthsAfter: nextAfter };
        });
        scrollUpdatedCursorKeyRef.current = visibleMonthKey;
        onVisibleMonthChange(visibleMonth);
      }
    }
  };

  return (
    <div
      aria-label="Calendar"
      className="task-calendar-month-stack"
      onScroll={appendMonthsWhenNearEnd}
      ref={stackRef}
      role="region"
      style={stackStyle}
      tabIndex={0}
    >
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
  );
}
