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
    groupBy: "subsystem",
    selectedDate: "2026-04-07",
    onSelectDate: jest.fn(),
    onOpenTask: jest.fn(),
    isAllProjectsView: true,
    ...overrides,
  }));
}

it("keeps the task name, assignee and labeled team icon independent of the timing bar", () => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], title: "Verify the complete sensor bundle before controls integration", startDate: "2026-04-07", dueDate: "2026-04-07" };
  bootstrap.responsibleGroups = [{ id: "electrical", seasonId: "season-1", name: "Electrical", projectIds: [task.projectId], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false }];
  task.responsibleGroupId = "electrical";
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain(`>${task.title}</button>`);
  expect(markup).toContain('aria-label="Ada"');
  expect(markup).toContain(">A</span>");
  expect(markup).toContain('role="img" aria-label="Team: Electrical" title="Team: Electrical"');
  expect(markup).not.toContain(">Electrical</span>");
  expect(markup).toContain("Drivebase");
  expect(markup).toContain("0 of 1 tasks complete");
  expect(markup).not.toContain(`aria-label="Inspect handoffs for ${task.title}"`);
  expect(markup).toContain("width:33.33333333333333%");
  const unavailable = renderGrid({ bootstrap, tasks: [{ ...task, responsibleGroupId: "missing" }] });
  expect(unavailable).toContain('role="img" aria-label="Team: Unavailable team" title="Team: Unavailable team"');
});

it("shows the first selected assignee's photo and counts unique additional assignees", () => {
  const bootstrap = createBootstrap();
  bootstrap.members[0].photoUrl = "https://example.com/ada.png";
  bootstrap.members.push({ ...bootstrap.members[0], id: "member-2", name: "Grace", photoUrl: "https://example.com/grace.png" });
  const task = { ...bootstrap.tasks[0], assigneeIds: ["member-2", "member-1", "member-2", "missing", "missing"] };
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain('aria-label="Grace, Ada, Unavailable assignee"');
  expect(markup).toContain('title="Grace, Ada, Unavailable assignee"');
  expect(markup).toContain('src="https://example.com/grace.png"');
  expect(markup).not.toContain("ada.png");
  expect(markup.match(/<img /g)).toHaveLength(1);
  expect(markup).toContain(">+2</span>");
});

it.each([
  [[], "member-1", 'aria-label="Ada"', ">A</span>"],
  [["missing"], "member-1", 'aria-label="Unavailable assignee"', ">?</span>"],
  [[], null, 'aria-label="Unassigned"', 'title="Unassigned"'],
] as const)("handles assignees %j with owner %s", (assigneeIds, ownerId, label, content) => {
  const bootstrap = createBootstrap();
  const markup = renderGrid({ bootstrap, tasks: [{ ...bootstrap.tasks[0], assigneeIds: [...assigneeIds], ownerId }] });
  expect(markup).toContain(label);
  expect(markup).toContain(content);
  expect(markup).not.toContain("task-assignee-summary-count");
});

it("exposes date selection and puts the supplied milestone lane before dates and work", () => {
  const markup = renderGrid({ milestoneLane: React.createElement("span", null, "Integration ready") });
  expect(markup).toContain('aria-label="Show agenda for 2026-04-07" aria-pressed="true"');
  expect(markup).toContain("Integration ready");
  expect(markup.indexOf("Integration ready")).toBeLessThan(markup.indexOf("product-timeline-header"));
  expect(markup.indexOf("Integration ready")).toBeLessThan(markup.indexOf("Drivebase"));
  expect(markup).toContain('aria-expanded="true"');
});

it("keeps project-level work available and hides redundant project headings", () => {
  const task = { ...createBootstrap().tasks[0], subsystemIds: [] };
  const markup = renderGrid({ tasks: [task], isAllProjectsView: false });
  expect(markup).toContain("General");
  expect(markup).toContain(task.title);
  expect(markup).not.toContain("is-project\"");
  expect(renderGrid({ tasks: [] })).toContain("No tasks match this schedule.");
});

it("shows a multi-subsystem task once in Team and in each selected Subsystem group", () => {
  const bootstrap = createBootstrap();
  bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "intake", name: "Intake" });
  const task = { ...bootstrap.tasks[0], subsystemIds: ["subsystem-1", "intake"] };
  const team = renderGrid({ bootstrap, tasks: [task], groupBy: "team" });
  const subsystem = renderGrid({ bootstrap, tasks: [task], groupBy: "subsystem" });
  expect(team).toContain("Unassigned team");
  expect(team).not.toContain('aria-label="Team:');
  expect(team.match(/data-task-id="task-1"/g)).toHaveLength(1);
  expect(subsystem.match(/data-task-id="task-1"/g)).toHaveLength(2);
  expect(subsystem).toContain("Drivebase");
  expect(subsystem).toContain("Intake");
  expect(team).toContain("0 of 1 tasks complete");
  expect(subsystem).toContain("0 of 1 tasks complete");
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
] as const)("pairs the %s status glyph with an accessible state label", (status, label) => {
  const bootstrap = createBootstrap();
  const task = { ...bootstrap.tasks[0], status };
  const markup = renderGrid({ bootstrap, tasks: [task] });
  expect(markup).toContain(`timeline-task-status-logo-signal-${status}`);
  expect(markup).toContain(`role="img" aria-label="${label}" title="${label}"`);
});

it("signals an unresolved prerequisite, then prioritizes a recorded blocker", () => {
  const bootstrap = createBootstrapWithDependency();
  const task = { ...bootstrap.tasks[1], startDate: "2026-04-07", dueDate: "2026-04-08" };
  bootstrap.tasks[1] = task;
  const waiting = renderGrid({ bootstrap, tasks: [task] });
  expect(waiting).toContain(`aria-haspopup="dialog" aria-label="Inspect handoffs for ${task.title}"`);
  expect(waiting).not.toContain("<dialog");
  expect(waiting).toContain("timeline-task-status-logo-signal-waiting-on-dependency");
  expect(waiting).toContain("Waiting on prerequisite");
  const blocked = renderGrid({ bootstrap, tasks: [{ ...task, isBlocked: true }] });
  expect(blocked).toContain("timeline-task-status-logo-signal-blocked");
  expect(blocked).toContain('role="img" aria-label="Blocked" title="Blocked"');
  expect(blocked).not.toContain("Waiting on prerequisite");
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

it("renders the effective status tone and full dates on short blocked bars", () => {
  const bootstrap = createBootstrap();
  const markup = renderGrid({ bootstrap, tasks: [{ ...bootstrap.tasks[0], isBlocked: true }] });
  expect(markup).toContain('data-status-signal="blocked"');
  expect(markup).toContain('--timeline-task-bar-background:var(--status-danger-bg)');
  expect(markup).toContain('--timeline-task-bar-text-color:var(--status-danger-text)');
  expect(markup).toContain('Blocked');
});
