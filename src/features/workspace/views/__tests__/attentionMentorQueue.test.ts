/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AttentionView,
  mentorQueueItemMatchesFilters,
} from "@/features/workspace/views/attention/AttentionView";
import { buildAttentionViewModel } from "@/features/workspace/views/attention/attentionViewModel";
import { createMentorQueueBootstrap } from "./attentionMentorQueue.fixture";
import { isoDateOffset } from "./attentionViewModel.fixture";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("mentor action queue", () => {
  it("builds approvals, help requests, risk reviews, and stale mentor tasks", () => {
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

  it("keeps QA review approvals scoped to actionable task subjects", () => {
    const bootstrap = createMentorQueueBootstrap();
    const viewModel = buildAttentionViewModel({
      activePersonFilter: [],
      bootstrap: {
        ...bootstrap,
        manufacturingItems: [
          {
            batchLabel: "CNC-1",
            dueDate: isoDateOffset(4),
            id: "manufacturing-visible",
            inHouse: false,
            material: "Aluminum 6061",
            materialId: null,
            mentorReviewed: false,
            partDefinitionId: null,
            partInstanceId: null,
            partInstanceIds: [],
            process: "cnc",
            quantity: 1,
            requestedById: "member-1",
            status: "requested",
            subsystemId: "subsystem-1",
            title: "Visible manufacturing job",
          },
        ],
        qaReviews: [
          ...(bootstrap.qaReviews ?? []),
          {
            id: "qa-review-hidden-task",
            mentorApproved: false,
            notes: "Hidden task review",
            participantIds: ["member-1"],
            result: "minor-fix",
            reviewedAt: `${isoDateOffset(-1)}T14:00:00.000Z`,
            subjectId: "task-hidden",
            subjectTitle: "Hidden task QA",
            subjectType: "task",
          },
          {
            id: "qa-review-hidden-manufacturing",
            mentorApproved: false,
            notes: "Hidden manufacturing review",
            participantIds: ["member-1"],
            result: "iteration-worthy",
            reviewedAt: `${isoDateOffset(-1)}T15:00:00.000Z`,
            subjectId: "manufacturing-hidden",
            subjectTitle: "Hidden manufacturing QA",
            subjectType: "manufacturing",
          },
          {
            id: "qa-review-visible-manufacturing",
            mentorApproved: false,
            notes: "Visible manufacturing review",
            participantIds: ["member-1"],
            result: "minor-fix",
            reviewedAt: `${isoDateOffset(-1)}T16:00:00.000Z`,
            subjectId: "manufacturing-visible",
            subjectTitle: "Visible manufacturing QA",
            subjectType: "manufacturing",
          },
        ],
      },
    });

    expect(
      viewModel.mentorQueueItems.find((item) => item.id === "mentor-qa-review-approval-qa-review-1"),
    ).toBeDefined();
    expect(
      viewModel.mentorQueueItems.find(
        (item) => item.id === "mentor-qa-review-approval-qa-review-hidden-task",
      ),
    ).toBeUndefined();
    expect(
      viewModel.mentorQueueItems.find(
        (item) => item.id === "mentor-qa-review-approval-qa-review-hidden-manufacturing",
      ),
    ).toBeUndefined();
    expect(
      viewModel.mentorQueueItems.find(
        (item) => item.id === "mentor-qa-review-approval-qa-review-visible-manufacturing",
      ),
    ).toBeUndefined();
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
    const bootstrap = createMentorQueueBootstrap();
    const scopedPurchaseTask = bootstrap.tasks.find((task) => task.id === "task-purchase");
    if (!scopedPurchaseTask) {
      throw new Error("Expected mentor purchase task fixture");
    }

    const viewModel = buildAttentionViewModel({
      activePersonFilter: ["mentor-1"],
      bootstrap: {
        ...bootstrap,
        tasks: [
          ...bootstrap.tasks,
          {
            ...scopedPurchaseTask,
            assigneeIds: [],
            dueDate: isoDateOffset(-3),
            id: "task-purchase-out-of-scope",
            mentorId: null,
            ownerId: null,
            title: "Earlier out-of-scope purchase task",
          },
        ],
      },
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
