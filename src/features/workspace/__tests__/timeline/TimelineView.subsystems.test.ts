import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TimelineGroupSummary } from "@/features/workspace/views/timeline/components/TimelineGroupSummary";
import { TimelineTaskNameCell } from "@/features/workspace/views/timeline/TimelineTaskNameCell";
import { buildTimelineTaskPresentations } from "@/features/workspace/views/timeline/model/timelineTaskPresentation";
import { buildTimelineTaskToneStyle, resolveTimelineRowHighlightStyle } from "@/features/workspace/views/timeline/model/timelineTaskColors";
import { buildTimelineDayMilestoneUnderlays } from "@/features/workspace/views/timeline/model/timelineMilestoneData";
import { buildTimelineGridLayout } from "@/features/workspace/views/timeline/model/timelineGridLayout";
import { createBootstrap, createTimelineMilestone } from "./timelineTestFixtures";

describe("timeline status and schedule presentation", () => {
  it("keeps completed work complete, then gives blockers precedence over unmet prerequisites", () => {
    const bootstrap = createBootstrap();
    const base = bootstrap.tasks[0];
    bootstrap.tasks = [
      { ...base, id: "complete", status: "complete", isBlocked: true },
      { ...base, id: "blocked", isBlocked: true },
      { ...base, id: "waiting", status: "in-progress" },
    ];
    bootstrap.taskDependencies = ["complete", "blocked", "waiting"].map((taskId) => ({
      id: `dependency-${taskId}`, taskId, kind: "task", refId: "missing", dependencyType: "hard", createdAt: "2026-04-01",
    }));
    const result = buildTimelineTaskPresentations(bootstrap, "2026-04-15");
    expect(result.complete.signal).toBe("complete");
    expect(result.complete.overdueDays).toBe(0);
    expect(result.blocked.signal).toBe("blocked");
    expect(result.waiting.signal).toBe("waiting-on-dependency");
    expect(result.waiting.dependencies[0]).toMatchObject({ label: "Unavailable task: missing", state: "Unavailable" });
  });

  it("marks only unfinished work before today overdue, including across DST", () => {
    const bootstrap = createBootstrap();
    bootstrap.tasks = [
      { ...bootstrap.tasks[0], id: "yesterday", dueDate: "2026-03-08" },
      { ...bootstrap.tasks[0], id: "today", dueDate: "2026-03-09" },
      { ...bootstrap.tasks[0], id: "tomorrow", dueDate: "2026-03-10" },
    ];
    const result = buildTimelineTaskPresentations(bootstrap, "2026-03-09");
    expect(result.yesterday.overdueLabel).toBe("Overdue · 1 day");
    expect(result.today.overdueLabel).toBe("");
    expect(result.tomorrow.overdueLabel).toBe("");
  });

  it("resolves dependency links from the full bootstrap, even when the referenced task is outside the visible range", () => {
    const bootstrap = createBootstrap();
    bootstrap.tasks.push({ ...bootstrap.tasks[0], id: "upstream", title: "Old prerequisite", status: "complete", dueDate: "2025-01-01" });
    bootstrap.taskDependencies = [{ id: "dep", taskId: bootstrap.tasks[0].id, kind: "task", refId: "upstream", dependencyType: "hard", createdAt: "2026-04-01" }];
    const result = buildTimelineTaskPresentations(bootstrap, "2026-04-15");
    expect(result[bootstrap.tasks[0].id].dependencies[0]).toMatchObject({ direction: "Prerequisite", label: "Old prerequisite", state: "Satisfied", task: { id: "upstream" } });
    expect(result.upstream.dependencies[0]).toMatchObject({ direction: "Dependent", task: { id: bootstrap.tasks[0].id } });
  });

  it("does not mistake non-task references with matching IDs for task dependents", () => {
    const bootstrap = createBootstrap();
    bootstrap.taskDependencies = [{ id: "part-dep", taskId: "other", kind: "part-instance", refId: bootstrap.tasks[0].id, dependencyType: "hard", createdAt: "2026-04-01" }];
    expect(buildTimelineTaskPresentations(bootstrap)[bootstrap.tasks[0].id].dependencies).toEqual([]);
  });

  it("keeps sticky task names, status, and overdue text visible without hover", () => {
    const bootstrap = createBootstrap();
    const task = bootstrap.tasks[0];
    const presentation = buildTimelineTaskPresentations(bootstrap, "2026-04-15")[task.id];
    const markup = renderToStaticMarkup(React.createElement(TimelineTaskNameCell, {
      task, presentation, gridRow: 1, taskColumnIndex: 3, taskColumnWidth: 240, taskStickyLeft: 240,
      isHighlighted: true, onOpenTask: jest.fn(), onMouseEnter: jest.fn(), onMouseLeave: jest.fn(),
    }));
    expect(markup).toContain(task.title);
    expect(markup).toContain(presentation.statusLabel);
    expect(markup).toContain(presentation.overdueLabel);
    expect(markup).toContain("left:240px");
  });

  it("replaces overlapping collapsed tasks with one neutral span and deduplicated counts", () => {
    const bootstrap = createBootstrap();
    const task = { ...bootstrap.tasks[0], offset: 2, span: 3, spillsLeft: false, spillsRight: false };
    const presentations = buildTimelineTaskPresentations(bootstrap, "2026-04-15");
    const markup = renderToStaticMarkup(React.createElement(TimelineGroupSummary, {
      tasks: [task, task], presentations, gridRow: 3, firstDayGridColumn: 4,
      taskColumnIndex: 3, taskColumnWidth: 240, taskStickyLeft: 240, onExpand: jest.fn(),
    }));
    expect(markup).toContain("Group span");
    expect(markup).toContain("1 tasks · 0 complete · 0 blocked · 1 overdue");
    expect(markup).toContain("grid-row:3;grid-column:6 / span 3");
    expect(markup).not.toContain('class="timeline-bar');
  });

  it("uses shared status surfaces while selection stays independent of discipline", () => {
    const bootstrap = createBootstrap();
    const task = bootstrap.tasks[0];
    const style = buildTimelineTaskToneStyle("blocked");
    expect(style).toMatchObject({ "--timeline-task-bar-background": "var(--status-danger-bg)", "--timeline-task-bar-text-color": "var(--status-danger-text)" });
    expect(resolveTimelineRowHighlightStyle(`task:${task.id}`, { [task.id]: task }, {})).toMatchObject({ "--timeline-row-highlight-selected-stroke": "var(--text-accent)" });
  });

  it("keeps coincident milestone guides on their actual dates and clamps ranged milestones", () => {
    const resolveGeometry = jest.fn(() => ({ left: 100, width: 48, centerX: 124, centerY: 80, bodyTop: 40, bodyHeight: 80 }));
    const underlays = buildTimelineDayMilestoneUnderlays({
      milestones: [
        createTimelineMilestone({ id: "one", startAt: "2026-04-08T09:00:00Z" }),
        createTimelineMilestone({ id: "two", startAt: "2026-04-08T14:00:00Z" }),
        createTimelineMilestone({ id: "range", startAt: "2026-04-01T09:00:00Z", endAt: "2026-04-09T09:00:00Z" }),
      ], timelineDays: ["2026-04-08", "2026-04-09"], resolveGeometry,
    });
    expect(underlays.map((item) => item.id)).toEqual(["range", "one", "two"]);
    expect(underlays[0]).toMatchObject({ startDay: "2026-04-08", endDay: "2026-04-09" });
    expect(underlays[1].geometry.left).toBe(underlays[2].geometry.left);
  });

  it("reserves a smaller sticky task column on compact screens", () => {
    const layout = buildTimelineGridLayout({ dayCount: 7, isAllProjectsView: false, isProjectColumnVisible: false,
      isSubsystemColumnVisible: false, timelineShellWidth: 390, timelineZoom: 1, viewInterval: "week" });
    expect(layout.taskColumnWidth).toBe(172);
    expect(layout.fixedTimelineColumnWidth).toBe(172);
    expect(layout.taskColumnIndex).toBe(layout.firstDayGridColumn - 1);
  });
});
