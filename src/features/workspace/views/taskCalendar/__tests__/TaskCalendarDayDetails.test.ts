/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarDayDetails } from "@/features/workspace/views/taskCalendar/TaskCalendarDayDetails";
import { TaskCalendarMonthGrid } from "@/features/workspace/views/taskCalendar/TaskCalendarMonthGrid";
import { TaskCalendarMonthToolbar } from "@/features/workspace/views/taskCalendar/TaskCalendarMonthToolbar";
import type { TaskCalendarEvent } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";

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

describe("TaskCalendarDayDetails", () => {
  it("renders a selected day detail list with every due item for that date", () => {
    const markup = renderToStaticMarkup(
      React.createElement(TaskCalendarDayDetails, {
        dateKey: "2026-05-07",
        events: [taskEvent, meetingEvent],
        onClose: jest.fn(),
        onOpenEvent: jest.fn(),
      }),
    );

    expect(markup).toContain("May 7, 2026");
    expect(markup).toContain("2 things due");
    expect(markup).toContain("Robot | Wire drivetrain");
    expect(markup).toContain("Task due");
    expect(markup).toContain("high");
    expect(markup).toContain("in-progress");
    expect(markup).toContain("Robot | Meeting: Build night");
    expect(markup).toContain("Meeting / event");
    expect(markup).toContain('aria-label="Open Robot | Wire drivetrain"');
  });
});

describe("TaskCalendarMonthGrid day selection", () => {
  it("renders clickable day cells and marks the selected day", () => {
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

    expect(markup).toContain('aria-label="View details for May 7, 2026 with 2 items"');
    expect(markup).toContain("task-calendar-day is-selected");
    expect(markup).toContain("task-calendar-day-open");
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
    const [actions] = React.Children.toArray(toolbar.props.children) as React.ReactElement<{
      children: React.ReactNode;
    }>[];
    const buttons = React.Children.toArray(actions.props.children) as React.ReactElement<{
      onClick: () => void;
    }>[];

    buttons.forEach((button) => button.props.onClick());

    expect(onMonthChange).toHaveBeenCalledTimes(3);
    expect(setMonthCursor).toHaveBeenCalledTimes(3);
  });
});
