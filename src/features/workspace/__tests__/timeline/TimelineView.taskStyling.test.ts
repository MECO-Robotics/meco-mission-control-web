import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineView } from "@/features/workspace/views/timeline/TimelineView";
import { createBootstrap, createBootstrapWithScopedOverflowTasks } from "./timelineTestFixtures";

function render(bootstrap = createBootstrap()) {
  return renderToStaticMarkup(React.createElement(TimelineView, {
    bootstrap, isAllProjectsView: false, activePersonFilter: [], setActivePersonFilter: jest.fn(),
    openTaskDetailModal: jest.fn(), openCreateTaskModal: jest.fn(), onDeleteTimelineMilestone: jest.fn(),
    onSaveTimelineMilestone: jest.fn(), triggerCreateMilestoneToken: 0,
  }));
}
describe("timeline visual meaning", () => {
  beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date("2026-04-15T12:00:00")); });
  afterEach(() => jest.useRealTimers());
  it("shows status surfaces, sticky names and a legend without relying on discipline colors", () => {
    const markup = render();
    expect(markup).toContain("--timeline-task-bar-background:var(--status-");
    expect(markup).not.toContain("--timeline-task-discipline-accent");
    expect(markup).toContain("timeline-task-name-cell");
    expect(markup).toContain('aria-label="Status legend"');
    expect(markup).toContain("Overdue ·");
  });
  it("preserves clipped date spans and exposes the full task description", () => {
    const markup = render(createBootstrapWithScopedOverflowTasks());
    expect(markup).toMatch(/<button[^>]*data-spill-left="true"/);
    expect(markup).toMatch(/<button[^>]*data-spill-right="true"/);
    expect(markup).toContain('role="tooltip"');
    expect(markup).toContain("aria-describedby=");
    expect(markup).toContain("March carry-in");
    expect(markup).toContain("Full scoped span");
  });
});
