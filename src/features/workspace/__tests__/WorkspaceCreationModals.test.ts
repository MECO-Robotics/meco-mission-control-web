/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MilestoneReportEditorModal } from "@/features/workspace/modals/workReports/EventReportEditorModal";
import { QaReportEditorModal } from "@/features/workspace/modals/workReports/QaReportEditorModal";
import { MilestonesMilestoneModal } from "@/features/workspace/views/milestones/MilestonesEventModal";
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
    workstreamIds: [],
    title: "Inspect intake",
    summary: "Verify the intake can survive QA.",
    subsystemIds: ["subsystem-1"],
    workTypeId: "work-type-design",
    responsibleGroupId: null,
    mechanismIds: [],
    partInstanceIds: [],
    scheduleRefs: [],
    requestedById: null,
    ownerId: null,
    assigneeIds: [],
    mentorId: null,
    startDate: "2026-05-01",
    dueDate: "2026-05-03",
    priority: "medium",
    status: "waiting-for-qa",

    checklistItems: [],
    manufacturingDetails: null,
    estimatedHours: 0,
    actualHours: 0,
    requiresDocumentation: false,
  };
  const risk: BootstrapPayload["risks"][number] = {
    id: "risk-1",
    projectId: "project-1",
    title: "Intake binding",
    detail: "Intake can bind under load.",
    category: "design",
    severity: "high",
    status: "open",
    blocksWork: true,
    source: { kind: "report", id: "report-1" },
    relatedTargets: [{ kind: "project", id: "project-1" }],
    mitigationTaskId: "task-1",
    ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
    createdAt: "2026-05-01",
    updatedAt: "2026-05-01",
    resolvedAt: null,
  };
  const milestone: BootstrapPayload["milestones"][number] = {
    id: "milestone-1",
    title: "Intake signoff",
    type: "deadline",
    status: "planned",
    seasonId: "season-1",
    startAt: "2026-05-20T12:00:00.000Z",
    endAt: null,
    description: "Complete intake review.",
    projectIds: ["project-1"],
  };

  return {
    ...bootstrap,
    tasks: [task],
    milestones: [milestone],
    risks: [risk],
  };
}

describe("workspace creation modals", () => {
  it("uses the detailed task shell for task creation", () => {
    const markup = renderTaskModal("create", {
      ownerId: null,
      assigneeIds: [],
      mentorId: null,
      subsystemIds: [],
    });

    expect(markup).toContain("modal-card task-details-modal task-editor-modal");
    expect(markup).toContain("panel-header compact-header task-details-header");
    expect(markup).toContain("task-details-close-button");
    expect(markup).toContain("Create Task Details");
    expect(markup).toContain("Add task title");
    expect(markup).toContain('data-inline-edit-field="project"');
    expect(markup).toContain("Task photo");
    expect(markup).toContain('data-inline-edit-field="summary"');
    expect(markup).toContain('data-inline-edit-field="priority"');
    expect(markup).toContain('data-inline-edit-field="owner"');
    expect(markup).toContain('data-inline-edit-field="assigned"');
    expect(markup).toContain('data-inline-edit-field="mentor"');
    expect(markup).toContain('data-inline-edit-field="subsystem"');
    expect(markup).toContain("Add a summary");
    expect(markup).toContain("Choose owner");
    expect(markup).toContain("Add teammates");
    expect(markup).toContain("Task metadata");
    expect(markup).toContain("Estimated hours");
    expect(markup).toContain("Requires documentation");
    expect(markup).toContain('disabled="" type="submit">Create task');
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
          status: "planned",
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
    expect(markup).toContain('aria-label="Close QA report modal"');
    expect(markup).toContain("modal-form task-details-grid");
    expect(markup).toContain("Result");
    expect(markup).toContain("Notes");
  });

  it("targets QA evidence at the selected task", () => {
    const bootstrap = createModalBootstrap();
    const payload = buildEmptyQaReportPayload(bootstrap);

    expect(payload.targetRefs).toEqual([{ kind: "task", id: "task-1" }]);
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
    expect(markup).toContain('aria-label="Close milestone report modal"');
    expect(markup).toContain("modal-form task-details-grid");
  });
});
