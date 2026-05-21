/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MilestoneReportEditorModal } from "@/features/workspace/modals/workReports/EventReportEditorModal";
import { QaReportEditorModal } from "@/features/workspace/modals/workReports/QaReportEditorModal";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
import { TimelineMilestoneModal } from "@/features/workspace/views/timeline/TimelineMilestoneModal";
import { buildEmptyQaReportPayload, buildEmptyTestResultPayload } from "@/lib/appUtils/payloadBuilders";
import type { BootstrapPayload } from "@/types/bootstrap";
import { renderTaskModal } from "./support/WorkspaceModals.task.test.helpers";
import { createBootstrap } from "./support/WorkspaceModals.test.shared";

jest.mock("react-dom", () => {
  const actual = jest.requireActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

function createModalBootstrap() {
  const bootstrap = createBootstrap();
  const task: BootstrapPayload["tasks"][number] = {
    id: "task-1",
    projectId: "project-1",
    workstreamId: null,
    workstreamIds: [],
    title: "Inspect intake",
    summary: "Verify the intake can survive QA.",
    subsystemId: "subsystem-1",
    subsystemIds: ["subsystem-1"],
    disciplineId: "design",
    mechanismId: null,
    mechanismIds: [],
    partInstanceId: null,
    partInstanceIds: [],
    targetMilestoneId: null,
    ownerId: null,
    assigneeIds: [],
    mentorId: null,
    startDate: "2026-05-01",
    dueDate: "2026-05-03",
    priority: "medium",
    status: "waiting-for-qa",
    dependencyIds: [],
    blockers: [],
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
    estimatedHours: 0,
    actualHours: 0,
    requiresDocumentation: false,
    documentationLinked: false,
  };
  const milestone: BootstrapPayload["milestones"][number] = {
    id: "milestone-1",
    title: "Intake signoff",
    type: "deadline",
    status: "ready",
    startDateTime: "2026-05-20T12:00:00.000Z",
    endDateTime: null,
    isExternal: false,
    description: "Complete intake review.",
    projectIds: ["project-1"],
  };

  return {
    ...bootstrap,
    tasks: [task],
    milestones: [milestone],
  };
}

describe("workspace creation modals", () => {
  it("uses the detailed task shell for task creation", () => {
    const markup = renderTaskModal("create", {
      ownerId: null,
      assigneeIds: [],
      mentorId: null,
      subsystemId: "",
      subsystemIds: [],
    });

    expect(markup).toContain("modal-card task-details-modal task-editor-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
    expect(markup).toContain("Create Task Details");
    expect(markup).toContain("Add task title");
    expect(markup).toContain('data-inline-edit-field="summary"');
    expect(markup).toContain('data-inline-edit-field="priority"');
    expect(markup).toContain('data-inline-edit-field="owner"');
    expect(markup).toContain('data-inline-edit-field="assigned"');
    expect(markup).toContain('data-inline-edit-field="mentor"');
    expect(markup).toContain('data-inline-edit-field="subsystem"');
    expect(markup).toContain("Add a summary");
    expect(markup).toContain("Choose owner");
    expect(markup).toContain("Add teammates");
  });

  it("uses the detailed task shell for timeline milestone creation", () => {
    const bootstrap = createModalBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TimelineMilestoneModal, {
        activeDayMilestones: [],
        activeMilestoneDay: "2026-05-20",
        bootstrap,
        milestoneDraft: {
          title: "",
          type: "deadline",
          isExternal: false,
          description: "",
          projectIds: ["project-1"],
        },
        milestoneEndDate: "",
        milestoneEndTime: "",
        milestoneError: null,
        milestoneStartDate: "2026-05-20",
        milestoneStartTime: "",
        isDeletingMilestone: false,
        isSavingMilestone: false,
        mode: "create",
        onClose: jest.fn(),
        onCancelEdit: jest.fn(),
        onDelete: jest.fn(),
        onSubmit: jest.fn(),
        onSwitchToTask: jest.fn(),
        portalTarget: {} as HTMLElement,
        setMilestoneDraft: jest.fn(),
        setMilestoneEndDate: jest.fn(),
        setMilestoneEndTime: jest.fn(),
        setMilestoneStartDate: jest.fn(),
        setMilestoneStartTime: jest.fn(),
      }),
    );

    expect(markup).toContain("modal-card task-details-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
  });

  it("uses the detailed task shell for milestones-view creation", () => {
    const bootstrap = createModalBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesMilestoneModal, {
        activeMilestone: null,
        bootstrap,
        milestoneError: null,
        milestoneModalMode: "create",
        milestoneStartDate: "2026-05-20",
        milestoneStartTime: "",
        milestoneEndDate: "",
        milestoneEndTime: "",
        isDeletingMilestone: false,
        isSavingMilestone: false,
        milestoneDraft: {
          title: "",
          type: "deadline",
          isExternal: false,
          description: "",
          projectIds: ["project-1"],
        },
        modalPortalTarget: {} as HTMLElement,
        onClose: jest.fn(),
        onCancelEdit: jest.fn(),
        onDelete: jest.fn(),
        onEditMilestone: jest.fn(),
        onSubmit: jest.fn(),
        projectsById: {
          "project-1": bootstrap.projects[0],
        },
        setMilestoneDraft: jest.fn(),
        setMilestoneEndDate: jest.fn(),
        setMilestoneEndTime: jest.fn(),
        setMilestoneStartDate: jest.fn(),
        setMilestoneStartTime: jest.fn(),
      }),
    );

    expect(markup).toContain("modal-card task-details-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
    expect(markup).toContain("modal-form task-details-grid");
  });

  it("uses the detailed task shell for QA report creation", () => {
    const bootstrap = createModalBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(QaReportEditorModal, {
        bootstrap,
        closeQaReportModal: jest.fn(),
        handleQaReportSubmit: jest.fn(),
        isSavingQaReport: false,
        requestPhotoUpload: jest.fn(async () => "https://cdn.example.test/qa.png"),
        qaReportDraft: buildEmptyQaReportPayload(bootstrap),
        setQaReportDraft: jest.fn(),
      }),
    );

    expect(markup).toContain("modal-card task-details-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
    expect(markup).toContain("modal-form task-details-grid");
  });

  it("keeps milestone report creation aligned with report modal chrome", () => {
    const bootstrap = createModalBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(MilestoneReportEditorModal, {
        bootstrap,
        closeMilestoneReportModal: jest.fn(),
        milestoneReportDraft: buildEmptyTestResultPayload(bootstrap),
        milestoneReportFindings: "",
        handleMilestoneReportSubmit: jest.fn(),
        isSavingMilestoneReport: false,
        requestPhotoUpload: jest.fn(async () => "https://cdn.example.test/milestone.png"),
        setMilestoneReportDraft: jest.fn(),
        setMilestoneReportFindings: jest.fn(),
      }),
    );

    expect(markup).toContain("modal-card task-details-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
    expect(markup).toContain("modal-form task-details-grid");
  });
});
