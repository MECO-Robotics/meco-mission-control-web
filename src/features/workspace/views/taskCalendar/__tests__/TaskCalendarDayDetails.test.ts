/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarDayDetails } from "@/features/workspace/views/taskCalendar/TaskCalendarDayDetails";
import { TaskCalendarFilterToolbar } from "@/features/workspace/views/taskCalendar/TaskCalendarFilterToolbar";
import { TaskCalendarMonthGrid } from "@/features/workspace/views/taskCalendar/TaskCalendarMonthGrid";
import { TaskCalendarMonthToolbar } from "@/features/workspace/views/taskCalendar/TaskCalendarMonthToolbar";
import type { TaskCalendarEvent } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";

const taskEvent: TaskCalendarEvent = {
  allDay: true,
  classNames: ["task-calendar-event", "task-calendar-event-task-due"],
  extendedProps: {
    contextLabel: "Robot",
    priority: "high",
    projectId: "project-robot",
    recordId: "task-drive",
    status: "in-progress",
    type: "task-due",
  },
  id: "task:task-drive",
  start: "2026-05-07",
  title: "Robot | Wire drivetrain",
};

const meetingEvent: TaskCalendarEvent = {
  allDay: false,
  classNames: ["task-calendar-event", "task-calendar-event-event"],
  extendedProps: {
    contextLabel: "Robot",
    projectId: "project-robot",
    recordId: "meeting-build",
    status: "build",
    type: "event",
  },
  id: "meeting:meeting-build",
  start: "2026-05-07T18:00:00",
  title: "Robot | Meeting: Build night",
};

function formatExpectedDayLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function findButtonByTitle(element: React.ReactNode, title: string): React.ReactElement<{
  onClick: (event: { stopPropagation: () => void }) => void;
  title?: string;
}> | null {
  if (!React.isValidElement(element)) {
    return null;
  }

  const reactElement = element as React.ReactElement<{
    children?: React.ReactNode;
    title?: string;
  }>;

  if (reactElement.type === "button" && reactElement.props.title === title) {
    return reactElement as React.ReactElement<{
      onClick: (event: { stopPropagation: () => void }) => void;
      title?: string;
    }>;
  }

  for (const child of React.Children.toArray(reactElement.props.children)) {
    const match = findButtonByTitle(child, title);
    if (match) {
      return match;
    }
  }

  return null;
}

describe("TaskCalendarDayDetails", () => {
  it("renders a selected day detail list with every due item for that date", () => {
    const dayLabel = formatExpectedDayLabel("2026-05-07");
    const markup = renderToStaticMarkup(
      React.createElement(TaskCalendarDayDetails, {
        dateKey: "2026-05-07",
        events: [taskEvent, meetingEvent],
        onClose: jest.fn(),
        onOpenEvent: jest.fn(),
      }),
    );

    expect(markup).toContain(dayLabel);
    expect(markup).toContain("2 things due");
    expect(markup).toContain("Robot | Wire drivetrain");
    expect(markup).toContain("Task due");
    expect(markup).toContain("high");
    expect(markup).toContain("in-progress");
    expect(markup).toContain("Robot | Meeting: Build night");
    expect(markup).toContain("Meeting / event");
    expect(markup).toContain('aria-label="Open Robot | Wire drivetrain"');
    expect(markup).not.toContain('aria-label="Open Robot | Meeting: Build night"');
  });
});

describe("TaskCalendarMonthGrid day selection", () => {
  it("renders clickable day cells and marks the selected day", () => {
    const dayLabel = formatExpectedDayLabel("2026-05-07");
    const markup = renderToStaticMarkup(
      React.createElement(TaskCalendarMonthGrid, {
        eventsByDateKey: new Map([["2026-05-07", [taskEvent, meetingEvent]]]),
        monthCells: [new Date(2026, 4, 7)],
        monthCursor: new Date(2026, 4, 1),
        onOpenDay: jest.fn(),
        onOpenEvent: jest.fn(),
        selectedDateKey: "2026-05-07",
        todayDateKey: "2026-05-08",
      }),
    );

    expect(markup).toContain(`aria-label="View details for ${dayLabel} with 2 items"`);
    expect(markup).toContain("task-calendar-day is-selected");
    expect(markup).toContain("task-calendar-day-open");
  });

  it("opens day details from event chips that do not have a direct modal", () => {
    const onOpenDay = jest.fn();
    const onOpenEvent = jest.fn();
    const grid = TaskCalendarMonthGrid({
      eventsByDateKey: new Map([["2026-05-07", [taskEvent, meetingEvent]]]),
      monthCells: [new Date(2026, 4, 7)],
      monthCursor: new Date(2026, 4, 1),
      onOpenDay,
      onOpenEvent,
      selectedDateKey: null,
      todayDateKey: "2026-05-08",
    });
    const meetingButton = findButtonByTitle(grid, meetingEvent.title);
    const taskButton = findButtonByTitle(grid, taskEvent.title);

    meetingButton?.props.onClick({ stopPropagation: jest.fn() });
    taskButton?.props.onClick({ stopPropagation: jest.fn() });

    expect(onOpenDay).toHaveBeenCalledWith("2026-05-07");
    expect(onOpenEvent).toHaveBeenCalledWith(taskEvent);
    expect(onOpenEvent).not.toHaveBeenCalledWith(meetingEvent);
  });
});

describe("TaskCalendarMonthToolbar", () => {
  it("notifies the parent before month controls change the visible month", () => {
    const onMonthChange = jest.fn();
    const setMonthCursor = jest.fn();
    const toolbar = TaskCalendarMonthToolbar({
      monthLabel: "May 2026",
      onMonthChange,
      setMonthCursor,
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const previousButton = findButtonByTitle(toolbar, "Previous month");
    const nextButton = findButtonByTitle(toolbar, "Next month");
    const todayButton = findButtonByTitle(toolbar, "Jump to current month");

    previousButton?.props.onClick({ stopPropagation: jest.fn() });
    nextButton?.props.onClick({ stopPropagation: jest.fn() });
    todayButton?.props.onClick({ stopPropagation: jest.fn() });

    expect(onMonthChange).toHaveBeenCalledTimes(3);
    expect(setMonthCursor).toHaveBeenCalledTimes(3);
  });
});

describe("TaskCalendarFilterToolbar", () => {
  it("keeps event filtering and sorting in one compact view menu", () => {
    const toolbar = TaskCalendarFilterToolbar({
      eventFilter: "qa-due",
      onEventFilterChange: jest.fn(),
      onSortModeChange: jest.fn(),
      sortMode: "priority",
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const [viewOptionsMenu] = React.Children.toArray(toolbar.props.children) as React.ReactElement<{
      activeCount: number;
      ariaLabel: string;
      buttonLabel: string;
      items: Array<{ label: string }>;
    }>[];

    expect(viewOptionsMenu.type).toBe(CompactFilterMenu);
    expect(viewOptionsMenu.props.ariaLabel).toBe("Calendar view options");
    expect(viewOptionsMenu.props.buttonLabel).toBe("View");
    expect(viewOptionsMenu.props.activeCount).toBe(2);
    expect(viewOptionsMenu.props.items.map((item) => item.label)).toEqual(["Event type", "Sort by"]);
  });
});
