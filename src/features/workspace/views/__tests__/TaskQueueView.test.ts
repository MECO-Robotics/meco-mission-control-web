/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { TaskQueueView } from "@/features/workspace/views";
import type { BootstrapPayload } from "@/types";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    disciplines: [
      {
        id: "discipline-1",
        code: "design",
        name: "Design",
      },
    ],
    members: [
      {
        id: "member-1",
        name: "Alex Builder",
        email: "alex@example.com",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
    ],
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
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drive",
        color: "#224466",
        description: "",
        photoUrl: "",
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
        subsystemId: "subsystem-1",
        subsystemIds: ["subsystem-1"],
        disciplineId: "discipline-1",
        mechanismId: null,
        mechanismIds: [],
        partInstanceId: null,
        partInstanceIds: [],
        title: "Prep robot",
        summary: "Prepare for event",
        targetEventId: null,
        photoUrl: "",
        ownerId: "member-1",
        assigneeIds: [],
        mentorId: null,
        startDate: "2026-03-01",
        dueDate: "2026-03-09",
        priority: "high",
        status: "in-progress",
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

describe("TaskQueueView", () => {
  it("renders a dedicated discipline column for tasks", () => {
    const bootstrap = createBootstrap();
    const markup = renderToStaticMarkup(
      React.createElement(TaskQueueView, {
        activePersonFilter: [],
        bootstrap,
        disciplinesById: { "discipline-1": bootstrap.disciplines[0] },
        isAllProjectsView: false,
        membersById: { "member-1": bootstrap.members[0] },
        openCreateTaskModal: jest.fn(),
        openEditTaskModal: jest.fn(),
        subsystemsById: { "subsystem-1": bootstrap.subsystems[0] },
      }),
    );

    expect(markup).toContain("data-label=\"Discipline\"");
    expect(markup).toContain("<span>Discipline</span>");
    expect(markup).toContain(">Design<");
  });
});
