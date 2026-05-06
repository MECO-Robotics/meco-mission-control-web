/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { MilestonesEventDetailsModal } from "@/features/workspace/views/milestones/MilestonesEventDetailsModal";
import type { BootstrapPayload, MilestoneRecord } from "@/types";

jest.mock("react-dom", () => {
  const actual = jest.requireActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    milestones: [
      {
        id: "milestone-1",
        title: "Subsystem review",
        type: "deadline",
        status: "ready",
        startDateTime: "2026-05-04T12:00:00.000Z",
        endDateTime: null,
        isExternal: false,
        description: "Review the drivebase subsystem",
        projectIds: ["project-1"],
      },
    ],
    milestoneRequirements: [
      {
        id: "milestone-1:requirement:1",
        milestoneId: "milestone-1",
        targetType: "subsystem",
        targetId: "subsystem-1",
        conditionType: "iteration",
        conditionValue: "iteration = 1",
        required: true,
        sortOrder: 1,
        notes: "",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drivebase",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        workstreamId: null,
        workstreamIds: [],
        title: "Build frame rails",
        summary: "",
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
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
        status: "complete",
        dependencyIds: [],
        blockers: [],
        linkedManufacturingIds: [],
        linkedPurchaseIds: [],
        estimatedHours: 0,
        actualHours: 0,
        requiresDocumentation: false,
        documentationLinked: false,
      },
    ],
  };
}

describe("MilestonesEventDetailsModal", () => {
  it("renders readiness as a list of milestone requirements and states", () => {
    const bootstrap = createBootstrap();
    const milestone = bootstrap.milestones[0] as MilestoneRecord;
    const modalPortalTarget = {} as HTMLElement;
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesEventDetailsModal, {
        activeMilestone: milestone,
        bootstrap,
        milestoneModalMode: "detail",
        modalPortalTarget,
        onClose: jest.fn(),
        onEditMilestone: jest.fn(),
        projectsById: {
          "project-1": bootstrap.projects[0],
        },
      }),
    );

    expect(markup).toContain("Requirements");
    expect(markup).toContain("Drivebase");
    expect(markup).toContain("Subsystem");
    expect(markup).toContain("Required");
    expect(markup).toContain("Complete");
    expect(markup).toContain("Iteration 1");
  });

  it("renders the task-style shell for milestone editing", () => {
    const bootstrap = createBootstrap();
    const milestone = bootstrap.milestones[0] as MilestoneRecord;
    const modalPortalTarget = {} as HTMLElement;
    const markup = renderToStaticMarkup(
      React.createElement(MilestonesEventDetailsModal, {
        activeMilestone: milestone,
        bootstrap,
        isDeletingMilestone: false,
        isSavingMilestone: false,
        milestoneDraft: {
          title: milestone.title,
          type: milestone.type,
          description: milestone.description,
          isExternal: milestone.isExternal,
          projectIds: milestone.projectIds,
        },
        milestoneEndDate: "",
        milestoneEndTime: "",
        milestoneError: null,
        milestoneModalMode: "edit",
        milestoneStartDate: "2026-05-04",
        milestoneStartTime: "12:00",
        modalPortalTarget,
        onClose: jest.fn(),
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

    expect(markup).toContain("milestone-edit-modal");
    expect(markup).toContain("Edit milestone details");
    expect(markup).toContain("task-detail-inline-edit-title-shell");
    expect(markup).toContain("task-detail-inline-edit-trigger-summary");
    expect(markup).toContain("task-detail-inline-edit-shell");
    expect(markup).not.toContain("task-detail-inline-edit-input-title");
    expect(markup).toContain("Save milestone");
  });
});
