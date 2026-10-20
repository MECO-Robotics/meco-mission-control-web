/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { HomeView } from "@/features/workspace/views/overview";
import { buildHomeViewModel } from "@/features/workspace/views/overview/overviewViewModel";
import { groupHomeActions } from "@/features/workspace/views/overview/HomeActionRequired";
import { milestoneDayOffset } from "@/features/workspace/views/overview/HomeMilestoneTimeline";
import { buildAttentionQueue } from "@/features/workspace/views/attention/attentionQueue";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const fixedToday = new Date("2026-05-17T12:00:00");

function createOverviewBootstrap() {
  const base = createBootstrap();
  const [project] = base.projects;
  const [workstream] = base.workstreams;
  const [subsystem] = base.subsystems;
  const [workType] = base.workTypes;

  return createBootstrap({
    tasks: [
      {
        ...base.tasks[0],
        id: "task-overdue",
        title: "Finish bellypan CAD",
        projectId: project.id,
        workstreamIds: [workstream.id],
        subsystemIds: [subsystem.id],
        workTypeId: workType.id,
        dueDate: "2026-05-16",
        priority: "critical",
        status: "not-started",
      },
      {
        ...base.tasks[0],
        id: "task-today",
        title: "Wire intake sensor",
        projectId: project.id,
        workstreamIds: [workstream.id],
        subsystemIds: [subsystem.id],
        workTypeId: workType.id,
        dueDate: "2026-05-17",
        priority: "high",
        status: "in-progress",
      },
      {
        ...base.tasks[0],
        id: "task-soon",
        title: "Review shooter checklist",
        projectId: project.id,
        workstreamIds: [workstream.id],
        subsystemIds: [subsystem.id],
        workTypeId: workType.id,
        dueDate: "2026-05-19",
        priority: "medium",
        status: "waiting-for-qa",
      },
      {
        ...base.tasks[0],
        id: "task-later",
        title: "Later media recap",
        projectId: project.id,
        workstreamIds: [workstream.id],
        subsystemIds: [subsystem.id],
        workTypeId: workType.id,
        dueDate: "2026-06-15",
        priority: "low",
        status: "complete",
      },
      {
        ...base.tasks[0],
        id: "task-other-project",
        title: "Other project task",
        projectId: "other-project",
        dueDate: "2026-05-20",
        status: "in-progress",
      },
    ],
    milestones: [
      {
        ...base.milestones[0],
        id: "milestone-soon",
        title: "Drive practice deadline",
        projectIds: [project.id],
        status: "planned",
        readinessStatus: "blocked",
        startAt: "2026-05-20T18:00:00.000Z",
      },
      ...["2026-06-10", "2026-07-10", "2026-08-10", "2026-09-10"].map((startAt, index) => ({
        ...base.milestones[0],
        id: `milestone-${index + 2}`,
        title: `Future gate ${index + 2}`,
        projectIds: [project.id],
        readinessStatus: index === 0 ? ("ready" as const) : undefined,
        status: "planned" as const,
        startAt,
      })),
      {
        ...base.milestones[0],
        id: "milestone-complete",
        title: "Completed gate",
        projectIds: [project.id],
        status: "complete",
        startAt: "2026-05-22T18:00:00.000Z",
      },
      {
        ...base.milestones[0],
        id: "milestone-other-project",
        title: "Other project gate",
        projectIds: ["other-project"],
        status: "planned",
        startAt: "2026-05-21T18:00:00.000Z",
      },
    ],
    risks: [
      {
        id: "risk-high",
        projectId: project.id,
        title: "Battery cart not inspected",
        detail: "Inspection checklist is still open.",
        category: "qa",
        severity: "high",
        status: "open",
        blocksWork: true,
        source: { kind: "report", id: "report-1" },
        relatedTargets: [{ kind: "project", id: project.id }],
        mitigationTaskId: null,
        ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
        createdAt: "2026-05-17",
        updatedAt: "2026-05-17",
        resolvedAt: null,
      },
      {
        id: "risk-other-project",
        projectId: "other-project",
        title: "Other project risk",
        detail: "This risk belongs to another project.",
        category: "qa",
        severity: "high",
        status: "open",
        blocksWork: true,
        source: { kind: "manual" },
        relatedTargets: [],
        mitigationTaskId: null,
        ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
        createdAt: "2026-05-17",
        updatedAt: "2026-05-17",
        resolvedAt: null,
      },
    ],
  });
}

describe("Workspace overview views", () => {
  it("shows scoped chart summaries and keeps record lists behind drilldowns", () => {
    const bootstrap = createOverviewBootstrap();
    const markup = renderToStaticMarkup(React.createElement(HomeView, {
      bootstrap,
      onOpenActionItem: jest.fn(),
      onOpenAllActions: jest.fn(),
      onOpenTask: jest.fn(),
      onOpenSchedule: jest.fn(),
      projectId: bootstrap.projects[0].id,
      scopeLabel: bootstrap.projects[0].name,
      today: fixedToday,
    }));
    expect(markup.indexOf("Action Required")).toBeLessThan(markup.indexOf("Upcoming milestones"));
    expect(markup.indexOf("Task status")).toBeLessThan(markup.indexOf("Upcoming milestones"));
    expect(markup).toContain("Drive practice deadline");
    expect(markup).toContain("Future gate 4");
    expect(markup).toContain("Ready");
    expect(markup).toContain("Not assessed");
    expect(markup).toContain("Blocked");
    expect(markup).not.toContain("Other project gate");
    expect(markup).not.toContain("Completed gate");
    expect(markup).toContain('aria-label="View tasks by status"');
    expect(markup).toContain("Waiting for QA");
    expect(markup).not.toContain("Later media recap");
    expect(markup).not.toContain("Finish bellypan CAD");
    expect(markup).not.toContain("Battery cart not inspected");
    expect(markup).toContain('aria-label="Overdue: 1 actions"');
    expect(markup).toContain('aria-label="Complete: 1 tasks"');
    expect(markup).toContain('aria-label="View all 4 tasks"');
  });

  it("shows an empty action state and keeps task status counts explicit", () => {
    const bootstrap = createOverviewBootstrap();
    bootstrap.tasks = bootstrap.tasks.map(task => ({
      ...task,
      dueDate: "2026-12-01",
      status: "complete",
    }));
    bootstrap.risks = [];
    const markup = renderToStaticMarkup(React.createElement(HomeView, {
      bootstrap,
      onOpenActionItem: jest.fn(),
      onOpenAllActions: jest.fn(),
      onOpenTask: jest.fn(),
      onOpenSchedule: jest.fn(),
      projectId: bootstrap.projects[0].id,
      today: fixedToday,
    }));
    expect(markup).toContain("No current action items in this scope.");
    expect(markup).toContain("Complete");
    expect(markup).toContain("4 tasks");
  });
});

describe("buildHomeViewModel", () => {
  it("scopes the task distribution and next four milestones to the selected project", () => {
    const bootstrap = createOverviewBootstrap();
    const projectId = bootstrap.projects[0].id;
    const model = buildHomeViewModel({ bootstrap, projectId, today: fixedToday });

    expect(model.upcomingMilestones.map((milestone) => milestone.id)).toEqual([
      "milestone-soon",
      "milestone-2",
      "milestone-3",
      "milestone-4",
    ]);
    expect(model.tasksByStatus["not-started"]).toHaveLength(1);
    expect(model.tasksByStatus["in-progress"]).toHaveLength(1);
    expect(model.tasksByStatus["waiting-for-qa"]).toHaveLength(1);
    expect(model.tasksByStatus.complete).toHaveLength(1);

    const allProjectsModel = buildHomeViewModel({ bootstrap, today: fixedToday });
    expect(allProjectsModel.upcomingMilestones.map((milestone) => milestone.id)).toContain("milestone-other-project");
    expect(allProjectsModel.tasksByStatus["in-progress"]).toHaveLength(2);
  });

  it("keeps action rows unique and limits them to the selected project", () => {
    const bootstrap = createOverviewBootstrap();
    const projectId = bootstrap.projects[0].id;
    const queue = buildAttentionQueue({
      activePersonFilter: [],
      bootstrap,
      projectId,
      today: fixedToday,
    });
    const riskRows = queue.filter((item) => item.recordId === "risk-high");

    expect(queue.some((item) => item.recordId === "risk-other-project")).toBe(false);
    expect(queue.some((item) => item.recordId === "task-other-project")).toBe(false);
    expect(riskRows).toHaveLength(1);
    expect(queue.some((item) => item.recordId === "task-overdue")).toBe(true);
    expect(queue[0].recordId).toBe("risk-high");
    expect(queue.map((item) => item.urgency)).toEqual([...queue.map((item) => item.urgency)].sort((left, right) => right - left));
  });
});

describe("Home chart data", () => {
  it("counts multi-signal records once and retains queue order in each drilldown", () => {
    const bootstrap = createOverviewBootstrap();
    const queue = buildAttentionQueue({ bootstrap, activePersonFilter: [], today: fixedToday });
    const groups = groupHomeActions(queue);
    const grouped = groups.flatMap(group => group.items);
    expect(grouped).toHaveLength(queue.length);
    expect(new Set(grouped.map(item => item.key)).size).toBe(queue.length);
    expect(groups.find(group => group.id === "blocked")?.items.map(item => item.recordId)).toContain("risk-high");
    expect(groups.find(group => group.id === "high-risk")?.items).toHaveLength(0);
    expect(groups.find(group => group.id === "waiting-qa")?.items.map(item => item.recordId)).toContain("task-soon");
    for (const group of groups) expect(group.items).toEqual(queue.filter(item => group.items.includes(item)));
  });

  it("uses calendar-day distances including across daylight-saving transitions", () => {
    expect(milestoneDayOffset("2026-05-17T23:00:00Z", fixedToday)).toBe(0);
    expect(milestoneDayOffset("2026-05-20", fixedToday)).toBe(3);
    expect(milestoneDayOffset("2026-03-09", new Date(2026, 2, 7, 12))).toBe(2);
  });

  it("keeps the task chart scoped to the selected person", () => {
    const bootstrap = createOverviewBootstrap();
    bootstrap.tasks[0].ownerId = "selected-person";
    bootstrap.tasks.slice(1).forEach(task => { task.ownerId = "someone-else"; task.assigneeIds = []; });
    const model = buildHomeViewModel({ bootstrap, today: fixedToday, activePersonFilter: ["selected-person"] });
    expect(Object.values(model.tasksByStatus).flat().map(task => task.id)).toEqual(["task-overdue"]);
  });
});
