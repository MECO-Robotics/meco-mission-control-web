/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IconEdit, IconManufacturing, IconParts } from "@/components/shared/Icons";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { TaskRecord } from "@/types/recordsExecution";
import { TaskQueueCard } from "@/features/workspace/views/taskQueue/state/taskQueueKanbanCardView";
import { readTaskSubsystemIds, readTaskWorkstreamIds } from "@/features/workspace/views/taskQueue/taskQueueKanbanCard";
import { getTaskQueueDisciplineIcon } from "@/features/workspace/views/taskQueue/taskQueueDisciplineBadge";
import { createTask, createTaskQueueBootstrap as createBootstrap } from "./taskQueueTestFixtures";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderCard(task: Partial<TaskRecord> = {}, bootstrap = createBootstrap()) {
  return renderToStaticMarkup(React.createElement(TaskQueueCard, {
    bootstrap, task: createTask(1, { dueDate: "2026-10-23", ...task }),
    membersById: Object.fromEntries(bootstrap.members.map((member) => [member.id, member])),
    projectsById: Object.fromEntries(bootstrap.projects.map((project) => [project.id, project])),
    subsystemsById: Object.fromEntries(bootstrap.subsystems.map((subsystem) => [subsystem.id, subsystem])),
    workstreamsById: Object.fromEntries(bootstrap.workstreams.map((workstream) => [workstream.id, workstream])),
    openEditTaskModal: jest.fn(),
  }));
}

function risk(overrides: Partial<BootstrapPayload["risks"][number]> = {}): BootstrapPayload["risks"][number] {
  return {
    id: "risk-1", projectId: "project-1", title: "Needs material", detail: "Stock is unavailable",
    category: "supply", severity: "medium", status: "open", blocksWork: true,
    source: { kind: "manual" }, relatedTargets: [{ kind: "task", id: "task-1" }],
    mitigationTaskId: null, ownerGroupId: null, ownerMemberId: null, mitigationDueDate: null,
    createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null, ...overrides,
  };
}

describe("Task Queue cards", () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date(2026, 9, 21, 12)));
  afterEach(() => jest.useRealTimers());

  it("orders title, context, exceptions and footer without repeating board context or description", () => {
    const bootstrap = createBootstrap();
    bootstrap.risks = [risk()];
    const markup = renderCard({ title: "Wire swerve", summary: "Execution details" }, bootstrap);
    expect(markup.indexOf("Wire swerve")).toBeLessThan(markup.indexOf("Drive (v1)"));
    expect(markup.indexOf("Drive (v1)")).toBeLessThan(markup.indexOf("1 blocker"));
    expect(markup.indexOf("1 blocker")).toBeLessThan(markup.indexOf("task-queue-board-card-footer"));
    expect(markup).not.toContain("Execution details");
    expect(markup).not.toContain("Design discipline");
    expect(markup).not.toContain(">Robot<");
    expect(markup).not.toContain("task-queue-board-card-priority-accented");
  });

  it("uses each task's project type for neutral context on a mixed board", () => {
    const bootstrap = createBootstrap();
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "outreach", projectType: "outreach", name: "Outreach" });
    bootstrap.workstreams.push({ id: "sponsor", projectId: "outreach", name: "Sponsor engagement", description: "", color: "#335577", isArchived: false });
    expect(renderCard({}, bootstrap)).toContain("Drive (v1)");
    expect(renderCard({ projectId: "outreach", workstreamIds: ["sponsor"] }, bootstrap)).toContain("Sponsor engagement");
    expect(renderCard({ subsystemIds: [] }, bootstrap)).not.toContain('class="task-queue-board-card-context"');
    expect(renderCard({ projectId: "outreach", workstreamIds: [] }, bootstrap)).not.toContain('class="task-queue-board-card-context"');
    expect(renderCard({}, bootstrap)).not.toContain("context-accent");
  });

  it("normalizes subsystem and workstream IDs consistently", () => {
    const task = createTask(1, { subsystemIds: ["subsystem-1", "", "subsystem-1"], workstreamIds: ["workstream-1", "", "workstream-1"] });
    expect(readTaskSubsystemIds(task)).toEqual(["subsystem-1"]);
    expect(readTaskWorkstreamIds(task)).toEqual(["workstream-1"]);
  });

  it.each([
    ["2026-10-20", "not-started", "Overdue · Oct 20", "danger"],
    ["2026-10-21", "not-started", "Due today", "warning"],
    ["2026-10-23", "not-started", "Due Oct 23", "neutral"],
    ["2026-10-20", "complete", "Due Oct 20", "neutral"],
    ["2026-10-21", "complete", "Due Oct 21", "neutral"],
    ["", "not-started", "No due date", "neutral"],
    ["bad-date", "not-started", "No due date", "neutral"],
    ["2026-02-30", "not-started", "No due date", "neutral"],
  ] as const)("renders %s on a %s task as %s", (dueDate, status, text, tone) => {
    expect(renderCard({ dueDate, status })).toContain(`data-tone="${tone}">${text}</span>`);
  });

  it("uses local calendar boundaries for due-today and overdue", () => {
    jest.setSystemTime(new Date(2026, 9, 21, 23, 59));
    expect(renderCard({ dueDate: "2026-10-21" })).toContain("Due today");
    jest.setSystemTime(new Date(2026, 9, 22, 0, 1));
    expect(renderCard({ dueDate: "2026-10-21" })).toContain("Overdue · Oct 21");
  });

  it("renders distinct labeled priority glyphs for all four levels", () => {
    const glyphs = ["low", "medium", "high", "critical"].map((priority) => {
      const markup = renderCard({ priority: priority as TaskRecord["priority"] });
      const label = priority[0].toUpperCase() + priority.slice(1) + " priority";
      expect(markup).toContain(`aria-label="${label}"`);
      expect(markup).toContain(`<title>${label}</title>`);
      return markup.match(/<title>.*?<\/svg>/)?.[0].replace(/<title>.*?<\/title>/, "");
    });
    expect(new Set(glyphs).size).toBe(4);
  });

  it("shows one avatar, counts additional assignees and exposes every name", () => {
    const markup = renderCard({ assigneeIds: ["member-2", "member-1", "member-2"] });
    expect(markup).toContain('aria-label="Quinn Maker, Alex Builder"');
    expect(markup).toContain(">Q<");
    expect(markup).toContain(">+1</span>");
    expect(markup).not.toContain("alex.png");
    expect(markup.match(/class="profile-avatar /g)).toHaveLength(1);
  });

  it("uses owner fallback and handles unassigned or unavailable people", () => {
    expect(renderCard()).toContain('src="https://example.com/alex.png"');
    expect(renderCard({ ownerId: null, assigneeIds: [] })).toContain(">Unassigned</span>");
    const unavailable = renderCard({ assigneeIds: ["missing-member", "member-1"] });
    expect(unavailable).toContain('aria-label="Unavailable assignee, Alex Builder"');
    expect(unavailable).toContain(">?<");
    expect(unavailable).toContain(">+1</span>");
    expect(unavailable).not.toContain(">Unassigned</span>");
  });

  it("shows active linked blockers and help independently of work-log notes", () => {
    const bootstrap = createBootstrap();
    bootstrap.risks = [risk(), risk({ id: "help", category: "help", blocksWork: false })];
    const markup = renderCard({}, bootstrap);
    expect(markup).toContain("1 blocker");
    expect(markup).toContain("Help requested");
    bootstrap.risks = [risk({ status: "resolved" }), risk({ id: "other", category: "help", relatedTargets: [{ kind: "task", id: "task-2" }] })];
    bootstrap.workLogs = [{ id: "old", taskId: "task-1", date: "2026-01-01", participantIds: [], hours: 2, notes: "Need help with wiring" }];
    const resolved = renderCard({}, bootstrap);
    expect(resolved).not.toContain("task-queue-board-card-exceptions");
    expect(resolved).not.toContain("Help requested");
    expect(resolved).not.toContain("logged");
    bootstrap.risks = [risk({ category: "help", status: "resolved", blocksWork: false })];
    expect(renderCard({}, bootstrap)).not.toContain("Help requested");
  });

  it("reuses the official discipline icons for task queue discipline options", () => {
    expect((getTaskQueueDisciplineIcon("design") as { type?: unknown } | null)?.type).toBe(IconEdit);
    expect((getTaskQueueDisciplineIcon("manufacturing") as { type?: unknown } | null)?.type).toBe(
      IconManufacturing,
    );
    expect((getTaskQueueDisciplineIcon("assembly") as { type?: unknown } | null)?.type).toBe(IconParts);
  });

  it("renders scouting as a simple binocular-style discipline icon", () => {
    const markup = renderToStaticMarkup(
      React.createElement(React.Fragment, null, getTaskQueueDisciplineIcon("scouting")),
    );

    expect(markup).toContain('viewBox="0 0 24 24"');
    expect(markup).toContain('cx="7" cy="12" r="4.8"');
    expect(markup).toContain('cx="17" cy="12" r="4.8"');
    expect(markup).toContain('stroke-opacity="0.6"');
    expect(markup).toContain('M5.6 10.3c.7-.5 1.4-.8 2.1-.8');
    expect(markup).toContain('M9.8 7.9h3.8');
  });
});
