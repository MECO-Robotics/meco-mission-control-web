import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductTimelineGrid } from "../../views/timeline/ProductTimelineGrid";
import { createBootstrap, createBootstrapWithDependency } from "./timelineTestFixtures";

function renderGrid(overrides: Partial<React.ComponentProps<typeof ProductTimelineGrid>> = {}) {
  const bootstrap = createBootstrap();
  return renderToStaticMarkup(React.createElement(ProductTimelineGrid, {
    bootstrap,
    tasks: bootstrap.tasks,
    days: ["2026-04-06", "2026-04-07", "2026-04-08"],
    viewInterval: "week",
    selectedDate: "2026-04-07",
    onSelectDate: jest.fn(),
    onOpenTask: jest.fn(),
    isAllProjectsView: true,
    ...overrides,
  }));
}

it("keeps a full name and ownership visible independently of the timing bar", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], title: "Verify the complete sensor bundle before controls integration", startDate: "2026-04-07", dueDate: "2026-04-07" };
  bootstrap.responsibleGroups = [{ id: "electrical", seasonId: "season-1", name: "Electrical", projectIds: [task.projectId], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false }];
  task.responsibleGroupId = "electrical";
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain(`>${task.title}</button>`);
  expect(markup).toContain("Ada · Electrical");
  expect(markup).toContain("Drivebase");
  expect(markup).toContain("0 of 1 tasks complete");
  expect(markup).not.toContain(`aria-label="Inspect handoffs for ${task.title}"`);
  expect(markup).toContain("width:33.33333333333333%");
});

it("exposes date selection and puts the supplied milestone lane before work", () => {
  const markup = renderGrid({ milestoneLane: React.createElement("span", null, "Integration ready") });
  expect(markup).toContain('aria-label="Show agenda for 2026-04-07" aria-pressed="true"');
  expect(markup.indexOf("Integration ready")).toBeLessThan(markup.indexOf("Drivebase"));
  expect(markup).toContain('aria-expanded="true"');
});

it("uses a weekly header for project span while retaining daily positions", () => {
  const markup = renderGrid({ viewInterval: "all" });
  expect(markup).toContain("is-project-span");
  expect(markup).toContain("Apr 6");
  expect(markup).toContain('aria-label="Show agenda for 2026-04-08"');
});

it("keeps project-level work available and hides redundant project headings", () => {
  const task = { ...createBootstrap().tasks[0], subsystemIds: [] };
  const markup = renderGrid({ tasks: [task], isAllProjectsView: false });
  expect(markup).toContain("General");
  expect(markup).toContain(task.title);
  expect(markup).not.toContain("is-project\"");
  expect(renderGrid({ tasks: [] })).toContain("No tasks match this schedule.");
});

it("omits rows and completion counts outside the selected period", () => {
  const bootstrap = createBootstrap();
  const outside = { ...bootstrap.tasks[0], id: "outside", title: "Later work", startDate: "2026-05-01", dueDate: "2026-05-02", status: "complete" as const };
  const markup = renderGrid({ bootstrap, tasks: [...bootstrap.tasks, outside] });
  expect(markup).not.toContain("Later work");
  expect(markup).not.toContain("Outside period");
  expect(markup).toContain("0 of 1 tasks complete");
});

it.each([
  ["not-started", "Not started"],
  ["in-progress", "In progress"],
  ["waiting-for-qa", "Waiting for QA"],
  ["complete", "Complete"],
] as const)("pairs the %s status glyph with readable state text", (status, label) => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status };
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain(`timeline-task-status-logo-signal-${status}`);
  expect(markup).toContain(`</svg></span>${label}</span>`);
});

it("signals an unresolved prerequisite, then prioritizes a recorded blocker", () => {
  const bootstrap = createBootstrapWithDependency();
  const task = { ...bootstrap.tasks[1], startDate: "2026-04-07", dueDate: "2026-04-08" };
  bootstrap.tasks[1] = task;
  const waiting = renderGrid({ bootstrap, tasks: [task] });
  expect(waiting).toContain("timeline-task-status-logo-signal-waiting-on-dependency");
  expect(waiting).toContain("Waiting on prerequisite");
  const blocked = renderGrid({ bootstrap, tasks: [{ ...task, isBlocked: true }] });
  expect(blocked).toContain("timeline-task-status-logo-signal-blocked");
  expect(blocked).toContain(">Blocked</span>");
  expect(blocked).toContain("Waiting on prerequisite");
});

it("shows completed work as complete despite stale blocker and prerequisite flags", () => {
  const bootstrap = createBootstrapWithDependency();
  const task = { ...bootstrap.tasks[1], startDate: "2026-04-07", dueDate: "2026-04-08", status: "complete" as const, isBlocked: true };
  bootstrap.tasks[1] = task;
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain("timeline-task-status-logo-signal-complete");
  expect(markup).not.toContain("timeline-task-status-logo-signal-blocked");
  expect(markup).not.toContain("timeline-task-status-logo-signal-waiting-on-dependency");
  expect(markup).not.toContain(">Blocked</span>");
  expect(markup).not.toContain("Waiting on prerequisite");
  expect(markup).toContain("1 of 1 tasks complete");
});
