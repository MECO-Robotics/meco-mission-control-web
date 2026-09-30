/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TaskCalendarDayDetails } from "@/features/workspace/views/taskCalendar/TaskCalendarDayDetails";
import { TaskCalendarMonthGrid } from "@/features/workspace/views/taskCalendar/TaskCalendarMonthGrid";
import type { TaskCalendarEvent } from "@/features/workspace/views/taskCalendar/taskCalendarEvents";
import { CompactFilterMenu } from "@/features/workspace/shared/filters/workspaceCompactFilterMenu";
import { TimelineCompactFilterMenu } from "@/features/workspace/views/timeline/components/TimelineCompactFilterMenu";
import { TimelineCalendarSortMenu } from "@/features/workspace/views/timeline/components/TimelineCalendarSortMenu";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";

const taskEvent: TaskCalendarEvent = {
  extendedProps: {
    contextLabel: "Robot",
    priority: "high",
    recordId: "task-drive",
    status: "in-progress",
    type: "task-due",
  },
  id: "task:task-drive",
  start: "2026-05-07",
  title: "Robot | Wire drivetrain",
};

const meetingEvent: TaskCalendarEvent = {
  extendedProps: {
    contextLabel: "Robot",
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
    expect(markup).toContain("Meeting");
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

describe("TimelineCompactFilterMenu", () => {
  it("keeps calendar event filters separate from sorting", () => {
    const menu = TimelineCompactFilterMenu({
      activeFilterCount: 1,
      calendarEventFilter: "qa-due",
      showCalendarFilters: true,
      onCalendarEventFilterChange: jest.fn(),
      activePersonFilter: [],
      bootstrap: EMPTY_BOOTSTRAP,
      workTypeFilter: [],
      workTypeFilterOptions: [],
      isAllProjectsView: false,
      onChangePersonFilter: jest.fn(),
      priorityFilter: [],
      projectFilter: [],
      setWorkTypeFilter: jest.fn(),
      setPriorityFilter: jest.fn(),
      setProjectFilter: jest.fn(),
      setStatusFilter: jest.fn(),
      setSubsystemFilter: jest.fn(),
      statusFilter: [],
      subsystemFilter: [],
      subsystemFilterOptions: [],
    }) as React.ReactElement<{
      activeCount: number;
      ariaLabel: string;
      buttonLabel: string;
      inlineItems: boolean;
      menuTitle?: string;
      items: Array<{
        hidden?: boolean;
        label: string;
        icon?: React.ReactNode;
        content?: React.ReactElement<{ compactSummary?: boolean; hideButtonIcon?: boolean; options?: Array<{ id: string; name: string }>; singleSelect?: boolean; value?: string[] }>;
      }>;
    }>;

    expect(menu.type).toBe(CompactFilterMenu);
    expect(menu.props.ariaLabel).toBe("Schedule filters");
    expect(menu.props.buttonLabel).toBe("Filters");
    expect(menu.props.menuTitle).toBeUndefined();
    expect(menu.props.inlineItems).toBe(true);
    expect(
      menu.props.items.find((item) => item.label === "Roster")?.content?.props.compactSummary,
    ).toBe(true);
    expect(menu.props.items.find((item) => item.label === "Roster")?.icon).toBeTruthy();
    expect(menu.props.items.find((item) => item.label === "Roster")?.content?.props.hideButtonIcon).toBe(true);
    const eventTypeFilter = menu.props.items.find((item) => item.label === "Event type");
    expect(eventTypeFilter?.icon).toBeTruthy();
    expect(eventTypeFilter?.content?.props.singleSelect).toBe(true);
    expect(eventTypeFilter?.content?.props.value).toEqual(["qa-due"]);
    expect(eventTypeFilter?.content?.props.options).toEqual(expect.arrayContaining([
      { id: "milestone", name: "Milestones" },
      { id: "qa-due", name: "Waiting QA" },
    ]));
    expect(menu.props.activeCount).toBe(2);
    expect(menu.props.items.filter((item) => item.hidden).map((item) => item.label)).toEqual([
      "Project",
      "Work type",
      "Subsystem",
      "Status",
      "Priority",
    ]);
    expect(menu.props.items.map((item) => item.label)).toEqual([
      "Project",
      "Roster",
      "Work type",
      "Subsystem",
      "Status",
      "Priority",
      "Event type",
    ]);
  });

  it("renders calendar sorting as a separate search-bar sort menu", () => {
    const onChange = jest.fn();
    const onDirectionChange = jest.fn();
    const menu = TimelineCalendarSortMenu({ onChange, direction: "asc", onDirectionChange, sortMode: "priority" }) as React.ReactElement<{
      activeCount: number;
      ariaLabel: string;
      items: Array<{
        label: string;
        labelControl: React.ReactElement<{ direction: string; onChange: (value: "asc" | "desc") => void }>;
        content: React.ReactElement<{
          value: string;
          onChange: (event: { currentTarget: { value: string } }) => void;
        }>;
      }>;
    }>;

    expect(menu.type).toBe(CompactFilterMenu);
    expect(menu.props.ariaLabel).toBe("Sort calendar events");
    expect(menu.props.activeCount).toBe(1);
    expect(menu.props.items.map((item) => item.label)).toEqual(["Sort by"]);
    expect(menu.props.items[0].labelControl.props.direction).toBe("asc");
    menu.props.items[0].labelControl.props.onChange("desc");
    expect(onDirectionChange).toHaveBeenCalledWith("desc");
    expect(menu.props.items[0].content.props.value).toBe("priority");
    menu.props.items[0].content.props.onChange({ currentTarget: { value: "date" } });
    expect(onChange).toHaveBeenCalledWith("date");
  });
});
