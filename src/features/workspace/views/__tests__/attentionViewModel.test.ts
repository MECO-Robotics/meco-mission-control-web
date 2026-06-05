/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import {
  AttentionView,
  mentorQueueItemMatchesFilters,
} from "@/features/workspace/views/attention/AttentionView";
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

function createMentorQueueBootstrap(): BootstrapPayload {
  const bootstrap = createBootstrap();

  return {
    ...bootstrap,
    members: [
      ...bootstrap.members,
      {
        email: "mentor@example.com",
        elevated: true,
        id: "mentor-1",
        name: "Morgan Mentor",
        role: "mentor",
        seasonId: "season-1",
      },
    ],
    purchaseItems: [
      {
        approvedByMentor: false,
        estimatedCost: 325,
        id: "purchase-1",
        linkLabel: "Vendor quote",
        partDefinitionId: null,
        quantity: 2,
        requestedById: "member-1",
        status: "requested",
        subsystemId: "subsystem-1",
        title: "Order swerve bearings",
        vendor: "Bearing Co",
      },
      {
        approvedByMentor: false,
        estimatedCost: 75,
        id: "purchase-2",
        linkLabel: "Vendor quote",
        partDefinitionId: null,
        quantity: 1,
        requestedById: "member-1",
        status: "requested",
        subsystemId: "subsystem-1",
        title: "Order encoder cable",
        vendor: "Cable Co",
      },
    ],
    reports: [
      ...bootstrap.reports,
      {
        createdAt: `${isoDateOffset(-1)}T13:00:00.000Z`,
        createdByMemberId: "member-1",
        id: "report-mentor-result",
        mentorApproved: false,
        milestoneId: null,
        notes: "Iteration should be reviewed.",
        projectId: "project-1",
        reportType: "QA",
        result: "iteration-worthy",
        status: "pass",
        summary: "Iteration-worthy result",
        taskId: "task-2",
        title: "Drivetrain QA result",
        workstreamId: null,
      },
    ],
    qaReviews: [
      {
        id: "qa-review-1",
        mentorApproved: false,
        notes: "Needs mentor signoff",
        participantIds: ["member-1"],
        result: "minor-fix",
        reviewedAt: `${isoDateOffset(-1)}T12:00:00.000Z`,
        subjectId: "task-2",
        subjectTitle: "Approve drivetrain QA",
        subjectType: "task",
      },
    ],
    risks: [
      ...bootstrap.risks,
      {
        attachmentId: "project-1",
        attachmentType: "project",
        detail: "Battery mount may fail inspection",
        id: "risk-mentor-review",
        mitigationTaskId: "task-stale-mentor",
        severity: "high",
        sourceId: "report-1",
        sourceType: "qa-report",
        title: "Battery retention risk",
      },
    ],
    tasks: [
      ...bootstrap.tasks.map((task) =>
        task.id === "task-2"
          ? { ...task, mentorId: "mentor-1", title: "Approve drivetrain QA" }
          : task,
      ),
      {
        actualHours: 0,
        artifactId: null,
        artifactIds: [],
        assigneeIds: ["member-1"],
        blockers: [],
        dependencyIds: [],
        disciplineId: "",
        documentationLinked: false,
        dueDate: isoDateOffset(7),
        estimatedHours: 1,
        id: "task-purchase",
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: ["purchase-1"],
        mechanismId: null,
        mechanismIds: [],
        mentorId: "mentor-1",
        ownerId: "member-1",
        partInstanceId: null,
        partInstanceIds: [],
        planningState: "ready",
        priority: "medium",
        projectId: "project-1",
        requiresDocumentation: false,
        startDate: isoDateOffset(-2),
        status: "not-started",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        summary: "Blocked on mentor purchase approval",
        targetMilestoneId: null,
        title: "Install swerve bearings",
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
        dueDate: isoDateOffset(4),
        estimatedHours: 1,
        id: "task-purchase-requester-only",
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: ["purchase-2"],
        mechanismId: null,
        mechanismIds: [],
        mentorId: "mentor-1",
        ownerId: "mentor-1",
        partInstanceId: null,
        partInstanceIds: [],
        planningState: "ready",
        priority: "medium",
        projectId: "project-1",
        requiresDocumentation: false,
        startDate: isoDateOffset(-1),
        status: "not-started",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        summary: "Requester needs mentor purchase approval.",
        targetMilestoneId: null,
        title: "Install encoder cable",
        workstreamId: null,
        workstreamIds: [],
      },
      {
        actualHours: 0,
        artifactId: null,
        artifactIds: [],
        assigneeIds: ["member-1"],
        blockers: [],
        dependencyIds: [],
        disciplineId: "",
        documentationLinked: false,
        dueDate: isoDateOffset(5),
        estimatedHours: 3,
        id: "task-stale-mentor",
        isBlocked: false,
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        mechanismId: null,
        mechanismIds: [],
        mentorId: "mentor-1",
        ownerId: "member-1",
        partInstanceId: null,
        partInstanceIds: [],
        planningState: "ready",
        priority: "low",
        projectId: "project-1",
        requiresDocumentation: false,
        startDate: isoDateOffset(-20),
        status: "in-progress",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        summary: "Needs mentor follow-up",
        targetMilestoneId: null,
        title: "Document climb iteration",
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

  it("renders the action required header without the compact subtitle", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AttentionView, {
        activePersonFilter: [],
        bootstrap: createBootstrap(),
        onOpenRisk: jest.fn(),
        onOpenTask: jest.fn(),
      }),
    );

    expect(markup).toContain("Action Required");
    expect(markup).not.toContain("Operational triage for immediate intervention");
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

  it("builds a mentor action queue across approvals, help requests, risk reviews, and stale mentor tasks", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createMentorQueueBootstrap(),
    });

    expect(viewModel.mentorQueueItems.map((item) => item.sourceLabel)).toEqual(
      expect.arrayContaining([
        "Pending QA approval",
        "Blocked student help",
        "Purchase approval",
        "Risk review",
        "Stale mentor task",
      ]),
    );
    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-purchase-approval-purchase-1"),
    ).toMatchObject({
      actionType: "open-task",
      openLabel: "Open linked task",
      recordId: "task-purchase",
      sourceType: "purchase",
      title: "Order swerve bearings",
    });
    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-qa-review-approval-qa-review-1"),
    ).toMatchObject({
      actionType: "open-task",
      recordId: "task-2",
      sourceType: "qa",
      statusLabel: "minor-fix",
    });
    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-qa-report-approval-report-mentor-result"),
    ).toMatchObject({
      priorityLabel: "high",
      recordId: "task-2",
      sourceType: "qa",
      statusLabel: "iteration-worthy",
    });
    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-risk-review-risk-mentor-review"),
    ).toMatchObject({
      actionType: "open-risk",
      recordId: "risk-mentor-review",
      sourceType: "risk",
    });
  });

  it("applies action required filters to mentor queue items", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: createMentorQueueBootstrap(),
    });
    const purchaseItem = viewModel.mentorQueueItems.find(
      (item) => item.id === "mentor-purchase-approval-purchase-1",
    );
    const qaItem = viewModel.mentorQueueItems.find(
      (item) => item.id === "mentor-qa-review-approval-qa-review-1",
    );

    expect(purchaseItem).toBeDefined();
    expect(qaItem).toBeDefined();
    expect(mentorQueueItemMatchesFilters(purchaseItem!, "purchase", "")).toBe(true);
    expect(mentorQueueItemMatchesFilters(purchaseItem!, "quality", "")).toBe(false);
    expect(mentorQueueItemMatchesFilters(qaItem!, "quality", "drivetrain")).toBe(true);
    expect(mentorQueueItemMatchesFilters(qaItem!, "quality", "swerve")).toBe(false);
  });

  it("keeps purchase approvals linked to selected mentor tasks", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: ["mentor-1"],
      bootstrap: createMentorQueueBootstrap(),
    });

    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-purchase-approval-purchase-1"),
    ).toMatchObject({
      actionType: "open-task",
      recordId: "task-purchase",
      sourceType: "purchase",
    });
  });

  it("keeps linked task targets for purchases requested by the selected person", () => {
    const viewModel = buildAttentionViewModel({
      activePersonFilter: ["member-1"],
      bootstrap: createMentorQueueBootstrap(),
    });

    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-purchase-approval-purchase-2"),
    ).toMatchObject({
      actionType: "open-task",
      openLabel: "Open linked task",
      recordId: "task-purchase-requester-only",
      sourceType: "purchase",
    });
  });

  it("renders mentor queue source links in the attention view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(AttentionView, {
        activePersonFilter: [],
        bootstrap: createMentorQueueBootstrap(),
        onOpenRisk: jest.fn(),
        onOpenTask: jest.fn(),
      }),
    );

    expect(markup).toContain("Mentor action queue");
    expect(markup).toContain("Pending QA approval");
    expect(markup).toContain("Purchase approval");
    expect(markup).toContain("Open linked task");
    expect(markup).toContain("Open risk");
  });
});
