import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScheduleAgendaPanel } from "../ScheduleAgendaPanel";
import { createBootstrap } from "@/features/workspace/__tests__/timeline/timelineTestFixtures";
import type { TaskCalendarEvent } from "../taskCalendarEvents";

function renderAgenda(startDate: string, endDate: string | null, selectedDate?: string, isVisible = true) {
  const events: TaskCalendarEvent[] = ["2026-03-31", "2026-04-01", "2026-04-30", "2026-05-01"].map((date) => ({
    id: date,
    title: `Meeting ${date}`,
    start: `${date}T18:00:00`,
    extendedProps: { recordId: date, type: "meeting", contextLabel: null },
  }));
  return renderToStaticMarkup(React.createElement(ScheduleAgendaPanel, {
    bootstrap: createBootstrap(),
    isAllProjectsView: false,
    startDate,
    selectedDate,
    isVisible,
    onClearSelectedDate: jest.fn(),
    endDate,
    events,
    onSaveMeeting: jest.fn(),
    onDeleteTimelineMilestone: jest.fn(),
    onSaveTimelineMilestone: jest.fn(),
    onTaskDetailOpen: jest.fn(),
  }));
}

it("shows only agenda items inside Gantt's inclusive visible dates", () => {
  const markup = renderAgenda("2026-04-01", "2026-04-30");
  expect(markup).toContain("Meeting 2026-04-01");
  expect(markup).toContain("Meeting 2026-04-30");
  expect(markup).not.toContain("Meeting 2026-03-31");
  expect(markup).not.toContain("Meeting 2026-05-01");
  expect(markup).not.toContain("Schedule date range");
});

it("updates content for another visible period and handles empty periods", () => {
  const may = renderAgenda("2026-05-01", "2026-05-31");
  expect(may).toContain("Meeting 2026-05-01");
  expect(may).not.toContain("Meeting 2026-04-30");
  expect(renderAgenda("2026-06-01", "2026-06-30")).toContain("No schedule items in this period.");
});

it("focuses one date and provides a way back to the period", () => {
  const markup = renderAgenda("2026-04-01", "2026-04-30", "2026-04-30");
  expect(markup).toContain("Meeting 2026-04-30");
  expect(markup).not.toContain("Meeting 2026-04-01");
  expect(markup).toContain("Show period");
  expect(renderAgenda("2026-04-01", "2026-04-30", "2026-04-15")).toContain("No schedule items on this date.");
});

it("keeps filtered Agenda mounted when hidden", () => {
  const markup = renderAgenda("2026-04-01", "2026-04-30", undefined, false);
  expect(markup).toContain('class="schedule-agenda-panel" hidden=""');
  expect(markup).toContain("Meeting 2026-04-01");
});

it("retires meeting saves across close/reopen and blocks duplicate submissions", async () => {
  const slots: unknown[] = [];
  let cursor = 0;
  const pendingEffects: Array<() => void> = [];
  const listeners = new Map<string, () => void>();
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { search: "", pathname: "/", hash: "" },
    addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
  } });
  const spies = [
    jest.spyOn(React, "useState").mockImplementation((initial?: unknown) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    }),
    jest.spyOn(React, "useRef").mockImplementation((initial) => (slots[cursor++] ??= { current: initial }) as ReturnType<typeof React.useRef>),
    jest.spyOn(React, "useMemo").mockImplementation((factory) => factory()),
    jest.spyOn(React, "useCallback").mockImplementation((callback) => callback),
    jest.spyOn(React, "useImperativeHandle").mockImplementation(() => {}),
    jest.spyOn(React, "useEffect").mockImplementation((effect, dependencies) => {
      const index = cursor++;
      const previous = slots[index] as { dependencies?: React.DependencyList; cleanup?: () => void } | undefined;
      if (!previous || dependencies?.some((dependency, i) => !Object.is(dependency, previous.dependencies?.[i]))) {
        pendingEffects.push(() => { previous?.cleanup?.(); slots[index] = { dependencies, cleanup: effect() }; });
      }
    }),
  ];
  try {
    let finish!: () => void;
    const onSaveMeeting = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const props: React.ComponentProps<typeof ScheduleAgendaPanel> = {
      bootstrap: createBootstrap(), isAllProjectsView: false, startDate: "2026-04-01", endDate: "2026-04-30", events: [],
      onSaveMeeting, onSaveTimelineMilestone: jest.fn(), onDeleteTimelineMilestone: jest.fn(), onTaskDetailOpen: jest.fn(),
    };
    const render = () => {
      cursor = 0;
      const panel = (ScheduleAgendaPanel as unknown as { render: (props: React.ComponentProps<typeof ScheduleAgendaPanel>, ref: null) => React.ReactElement<{ children: React.ReactElement[] }> }).render(props, null);
      pendingEffects.splice(0).forEach((effect) => effect());
      return panel.props.children[2].props as React.ComponentProps<typeof import("../MeetingScheduleModal").MeetingScheduleModal>;
    };
    render();
    listeners.get("mission-control:open-meeting")!();
    render().setDraft((draft) => ({ ...draft, title: "Original" }));
    const meeting = render();
    const event = { preventDefault: jest.fn() } as never;
    meeting.onSubmit(event);
    meeting.onSubmit(event);
    expect(onSaveMeeting).toHaveBeenCalledTimes(1);
    render().onClose();
    listeners.get("mission-control:open-meeting")!();
    render().setDraft((draft) => ({ ...draft, title: "New draft" }));
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(render()).toMatchObject({ isOpen: true, isSaving: false, error: null, draft: { title: "New draft" } });
  } finally {
    spies.forEach((spy) => spy.mockRestore());
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});
