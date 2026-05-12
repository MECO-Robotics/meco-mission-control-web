/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { AttentionView } from "@/features/workspace/views/attention/AttentionView";
import { buildAttentionViewModel } from "@/features/workspace/views/attention/attentionViewModel";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function isoDateOffset(daysFromToday: number) {
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  return target.toISOString().slice(0, 10);
}

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    members: [
      {
        email: "alex@example.com",
        elevated: false,
        id: "member-1",
        name: "Alex",
        role: "student",
        seasonId: "season-1",
      },
    ],
    projects: [
      {
        description: "",
        id: "project-1",
        name: "Robot",
        projectType: "robot",
        seasonId: "season-1",
        status: "active",
      },
    ],
    reports: [
      {
        createdAt: `${isoDateOffset(-1)}T10:00:00.000Z`,
        createdByMemberId: "member-1",
        id: "report-1",
        milestoneId: null,
        notes: "Needs rework",
        projectId: "project-1",
        reportType: "QA",
        result: "fail",
        status: "fail",
        summary: "Observed failure",
        taskId: "task-1",
        title: "Drive QA",
        workstreamId: null,
      },
      {
        createdAt: `${isoDateOffset(-2)}T10:00:00.000Z`,
        createdByMemberId: "member-1",
        id: "report-2",
        milestoneId: null,
        notes: "No linked task",
        projectId: "project-1",
        reportType: "QA",
        result: "fail",
        status: "fail",
        summary: "Untracked failure",
        taskId: null,
        title: "Orphan QA",
        workstreamId: null,
      },
    ],
    risks: [
      {
        attachmentId: "project-1",
        attachmentType: "project",
        detail: "Drive burnout risk",
        id: "risk-1",
        mitigationTaskId: null,
        severity: "high",
        sourceId: "report-1",
        sourceType: "qa-report",
        title: "Drive overheating",
      },
    ],
    subsystems: [
      {
        color: "#123456",
        description: "",
        id: "subsystem-1",
        isCore: true,
        iteration: 1,
        mentorIds: [],
        name: "Drive",
        parentSubsystemId: null,
        photoUrl: "",
        projectId: "project-1",
        responsibleEngineerId: null,
        risks: [],
      },
    ],
    tasks: [
      {
        actualHours: 0,
        artifactId: null,
        artifactIds: [],
        assigneeIds: [],
        blockers: ["external-delay"],
        dependencyIds: [],
        disciplineId: "",
        documentationLinked: false,
        dueDate: isoDateOffset(-1),
        estimatedHours: 2,
        id: "task-1",
        isBlocked: true,
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        mechanismId: null,
        mechanismIds: [],
        mentorId: null,
        ownerId: null,
        partInstanceId: null,
        partInstanceIds: [],
        photoUrl: "",
        planningState: "blocked",
        priority: "high",
        projectId: "project-1",
        requiresDocumentation: false,
        startDate: isoDateOffset(-8),
        status: "in-progress",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        summary: "Blocked by test stand",
        targetMilestoneId: null,
        title: "Repair drive module",
        workstreamId: null,
        workstreamIds: [],
      },
      {
        actualHours: 0,
        artifactId: null,
        artifactIds: [],
        assigneeIds: [],
        blockers: [],
        dependencyIds: [],
        disciplineId: "",
        documentationLinked: false,
        dueDate: isoDateOffset(1),
        estimatedHours: 1,
        id: "task-2",
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        mechanismId: null,
        mechanismIds: [],
        mentorId: null,
        ownerId: "member-1",
        partInstanceId: null,
        partInstanceIds: [],
        photoUrl: "",
        planningState: "ready",
        priority: "medium",
        projectId: "project-1",
        requiresDocumentation: false,
        startDate: isoDateOffset(-6),
        status: "waiting-for-qa",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        summary: "Waiting mentor QA",
        targetMilestoneId: null,
        title: "Validate drivetrain tuning",
        workstreamId: null,
        workstreamIds: [],
      },
    ],
  };
}

describe("buildAttentionViewModel", () => {
  it("renders action required filters inside the search overlay", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AttentionView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        onOpenRisk: jest.fn(),
        onOpenTask: jest.fn(),
      }),
    );

    expect(markup).toContain("topbar-responsive-search-actions");
    expect(markup).toContain("--topbar-responsive-search-action-overlay-width:2rem");
    expect(markup).toContain("attention-filter-menu");
    expect(markup).toContain('aria-label="Action required filters"');
  });

  it("builds grouped summary cards and ranked action-now items", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createBootstrap(),
    });

    expect(viewModel.summaryGroups.map((group) => group.label)).toEqual([
      "Risk",
      "Flow",
      "Supply",
      "Quality",
    ]);

    const allCards = viewModel.summaryGroups.flatMap((group) => group.cards);
    expect(allCards.some((card) => card.label === "Blocked tasks" && card.helperLabel)).toBe(true);
    expect(allCards.some((card) => card.label === "Failed QA/reports" && card.helperLabel)).toBe(
      true,
    );

    expect(viewModel.actionNowItems.some((item) => item.sourceType === "qa")).toBe(true);
    expect(viewModel.actionNowItems.some((item) => item.title === "Drive overheating")).toBe(true);

    for (let i = 1; i < viewModel.actionNowItems.length; i += 1) {
      expect(viewModel.actionNowItems[i - 1].urgencyScore).toBeGreaterThanOrEqual(
        viewModel.actionNowItems[i].urgencyScore,
      );
    }
  });
});
