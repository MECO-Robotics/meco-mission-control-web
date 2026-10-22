import React from "react";
import { TimelineView } from "../TimelineView";
import { TimelineToolbar } from "../TimelineToolbar";
import { ProductTimelineGrid } from "../ProductTimelineGrid";
import { ScheduleAgendaPanel } from "../../taskCalendar/ScheduleAgendaPanel";
import { createBootstrap } from "@/features/workspace/__tests__/timeline/timelineTestFixtures";

jest.mock("../hooks/useTimelineViewState", () => ({ useTimelineViewState: () => ({ viewAnchorDate: "2026-04-01", viewInterval: "month", timelineZoom: 1 }) }));
jest.mock("../hooks/useTimelineViewFilters", () => ({ useTimelineViewFilters: () => ({ filters: {} }) }));
jest.mock("../hooks/useTimelineViewData", () => ({ useTimelineViewData: () => ({ days: ["2026-04-01", "2026-04-30"], tasks: [], milestones: [], agendaEvents: [] }) }));
jest.mock("../hooks/useTimelinePeriodNavigation", () => ({ useTimelinePeriodNavigation: () => ({}) }));

function findElement<P>(node: unknown, type: unknown): React.ReactElement<P> {
  const element = node as React.ReactElement<{ children?: unknown }>;
  if (element?.type === type) return element as React.ReactElement<P>;
  for (const child of React.Children.toArray(element?.props?.children as React.ReactNode)) {
    try { return findElement<P>(child, type); } catch { /* Continue through sibling elements. */ }
  }
  throw new Error("Expected Schedule element was missing");
}

it("keeps Gantt available, opens phone Agenda for dates and the floating arrow, and preserves desktop visibility across resize", () => {
  const previousWindow = globalThis.window;
  let onResize: (() => void) | undefined;
  const media = { matches: true, addEventListener: jest.fn((_name, callback) => { onResize = callback; }), removeEventListener: jest.fn() };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { matchMedia: () => media } });
  const slots: unknown[] = [];
  let cursor = 0;
  const cleanup: { current?: () => void } = {};
  const spies = [
    jest.spyOn(React, "useState").mockImplementation((initial?: unknown) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    }),
    jest.spyOn(React, "useRef").mockReturnValue({ current: null }),
    jest.spyOn(React, "useId").mockReturnValue("schedule-agenda-test"),
    jest.spyOn(React, "useEffect").mockImplementation((effect) => { if (!cleanup.current) cleanup.current = effect() || undefined; }),
  ];
  const props: React.ComponentProps<typeof TimelineView> = {
    bootstrap: createBootstrap(), isAllProjectsView: false, activePersonFilter: [], setActivePersonFilter: jest.fn(),
    onSaveMeeting: jest.fn(), onSaveTimelineMilestone: jest.fn(), onDeleteTimelineMilestone: jest.fn(),
    openTaskDetailModal: jest.fn(), openCreateTaskModal: jest.fn(), triggerCreateMilestoneToken: 0,
  };
  const render = () => {
    cursor = 0;
    const view = TimelineView(props);
    return {
      view,
      agenda: findElement<React.ComponentProps<typeof ScheduleAgendaPanel>>(view, ScheduleAgendaPanel).props,
      grid: findElement<React.ComponentProps<typeof ProductTimelineGrid>>(view, ProductTimelineGrid).props,
      toolbar: findElement<React.ComponentProps<typeof TimelineToolbar>>(view, TimelineToolbar).props,
    };
  };
  const toggle = () => findElement<React.ButtonHTMLAttributes<HTMLButtonElement>>(render().view, "button").props;
  try {
    expect(render().agenda).toMatchObject({ presentation: "modal", isVisible: false });
    expect(toggle()).toMatchObject({ "aria-label": "Open agenda", "aria-haspopup": "dialog" });
    expect(render().toolbar.groupBy).toBe("team");
    expect(render().grid.groupBy).toBe("team");
    const tasks = render().grid.tasks;
    const days = render().grid.days;
    render().toolbar.onGroupByChange("subsystem");
    expect(render().toolbar.groupBy).toBe("subsystem");
    expect(render().grid).toMatchObject({ groupBy: "subsystem", tasks, days });
    render().grid.onSelectDate("2026-04-30");
    expect(render().agenda).toMatchObject({ presentation: "modal", isVisible: true, selectedDate: "2026-04-30" });
    render().agenda.onClose!();
    expect(render().agenda.isVisible).toBe(false);
    toggle().onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(render().agenda.isVisible).toBe(true);
    media.matches = false;
    onResize!();
    expect(render().agenda).toMatchObject({ presentation: "inline", isVisible: true });
    expect(toggle()).toMatchObject({ "aria-label": "Collapse agenda", "aria-controls": render().agenda.id, "aria-expanded": true });
    toggle().onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(render().agenda.isVisible).toBe(false);
    expect(toggle()).toMatchObject({ "aria-label": "Expand agenda", "aria-expanded": false });
    toggle().onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(render().agenda.isVisible).toBe(true);
    toggle().onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(render().agenda.isVisible).toBe(false);
    expect(toggle()["aria-expanded"]).toBe(false);
    media.matches = true;
    onResize!();
    expect(render().agenda).toMatchObject({ presentation: "modal", isVisible: false });
    expect(toggle()).toMatchObject({ "aria-label": "Open agenda", "aria-haspopup": "dialog" });
    media.matches = false;
    onResize!();
    expect(render().agenda).toMatchObject({ presentation: "inline", isVisible: false });
    render().grid.onSelectDate("2026-04-01");
    expect(render().agenda).toMatchObject({ presentation: "inline", isVisible: true, selectedDate: "2026-04-01" });
    expect(toggle()["aria-expanded"]).toBe(true);
    render().toolbar.onGroupByChange("team");
    expect(render().grid.groupBy).toBe("team");
    expect(render().agenda).toMatchObject({ isVisible: true, selectedDate: "2026-04-01" });
  } finally {
    cleanup.current?.();
    spies.forEach((spy) => spy.mockRestore());
    Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});
