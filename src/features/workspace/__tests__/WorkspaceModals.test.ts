/// <reference types="jest" />

import * as React from "react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MechanismEditorModal,
  PartDefinitionEditorModal,
  SubsystemEditorModal,
  TaskEditorModal,
} from "@/features/workspace/WorkspaceModals";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { buildEmptyTaskPayload } from "@/lib/appUtils";
import type { BootstrapPayload, TaskRecord } from "@/types";

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
    members: [
      {
        id: "student-1",
        name: "Student",
        email: "student@meco.test",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
      {
        id: "student-2",
        name: "Taylor",
        email: "taylor@meco.test",
        role: "student",
        elevated: false,
        seasonId: "season-1",
      },
      {
        id: "mentor-1",
        name: "Mentor",
        email: "mentor@meco.test",
        role: "mentor",
        elevated: true,
        seasonId: "season-1",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drive",
        description: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    disciplines: [
      {
        id: "discipline-1",
        code: "mechanical",
        name: "Mechanical",
      },
    ],
  };
}

function renderTaskModal(taskModalMode: ComponentProps<typeof TaskEditorModal>["taskModalMode"]) {
  const bootstrap = createBootstrap();
  const taskDraft = {
    ...buildEmptyTaskPayload(bootstrap),
    actualHours: 2,
  };
  const activeTask: TaskRecord = {
    id: "task-1",
    ...taskDraft,
    linkedManufacturingIds: [],
    linkedPurchaseIds: [],
  };

  return renderToStaticMarkup(
    React.createElement(TaskEditorModal, {
      activeTask: taskModalMode === "edit" ? activeTask : null,
      bootstrap,
      closeTaskModal: jest.fn(),
      disciplinesById: Object.fromEntries(
        bootstrap.disciplines.map((discipline) => [discipline.id, discipline]),
      ),
      eventsById: {},
      handleDeleteTask: jest.fn(),
      handleTaskSubmit: jest.fn(),
      isDeletingTask: false,
      isSavingTask: false,
      mechanismsById: {},
      mentors: bootstrap.members.filter((member) => member.role === "mentor"),
      partDefinitionsById: {},
      partInstancesById: {},
      students: bootstrap.members.filter((member) => member.role !== "mentor"),
      taskDraft,
      taskDraftBlockers: "",
      taskModalMode,
      setTaskDraft: jest.fn(),
      setTaskDraftBlockers: jest.fn(),
    }),
  );
}

function renderIterationEditors() {
  const bootstrap = createBootstrap();
  const noop = jest.fn();

  return [
    renderToStaticMarkup(
      React.createElement(PartDefinitionEditorModal, {
        activePartDefinitionId: null,
        bootstrap,
        closePartDefinitionModal: noop,
        handleDeletePartDefinition: noop,
        handlePartDefinitionSubmit: noop,
        isDeletingPartDefinition: false,
        isSavingPartDefinition: false,
        partDefinitionDraft: {
          name: "Bearing Block",
          partNumber: "BB-001",
          revision: "A",
          iteration: 1,
          type: "custom",
          source: "Onshape",
          materialId: null,
          description: "",
        },
        partDefinitionModalMode: "create",
        setPartDefinitionDraft: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(SubsystemEditorModal, {
        activeSubsystemId: null,
        bootstrap,
        closeSubsystemModal: noop,
        handleSubsystemSubmit: noop,
        isSavingSubsystem: false,
        subsystemDraft: {
          projectId: "project-1",
          name: "Drive",
          description: "Drive subsystem",
          iteration: 1,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
        },
        subsystemDraftRisks: "",
        subsystemModalMode: "create",
        setSubsystemDraft: noop,
        setSubsystemDraftRisks: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(MechanismEditorModal, {
        activeMechanismId: null,
        bootstrap,
        closeMechanismModal: noop,
        handleDeleteMechanism: noop,
        handleMechanismSubmit: noop,
        isDeletingMechanism: false,
        isSavingMechanism: false,
        mechanismDraft: {
          subsystemId: "subsystem-1",
          name: "Gearbox",
          description: "Drive gearbox",
          iteration: 1,
        },
        mechanismModalMode: "create",
        setMechanismDraft: noop,
      }),
    ),
  ].join("");
}

describe("TaskEditorModal", () => {
  it("hides actual hours while creating a task", () => {
    expect(renderTaskModal("create")).not.toContain("Actual hours");
  });

  it("labels the task create modal heading as Create task", () => {
    expect(renderTaskModal("create")).toContain(
      '<h2 style="color:var(--text-title)">Create task</h2>',
    );
  });

  it("keeps actual hours visible while editing a task", () => {
    expect(renderTaskModal("edit")).toContain("Actual hours");
  });

  it("renders a multi-student assignment control", () => {
    expect(renderTaskModal("create")).toContain("Assigned students");
    expect(renderTaskModal("create")).toContain("Taylor");
  });

  it("keeps task deletion inside the edit modal only", () => {
    expect(renderTaskModal("create")).not.toContain("Delete task");
    expect(renderTaskModal("edit")).toContain("Delete task");
  });

  it("omits task traceability text", () => {
    expect(renderTaskModal("create")).not.toContain("Task traceability");
    expect(renderTaskModal("edit")).not.toContain("Task traceability");
  });

  it("renders iteration selectors for definition editors", () => {
    const markup = renderIterationEditors();

    expect(markup).toContain("Part iteration");
    expect(markup).toContain("Subsystem iteration");
    expect(markup).toContain("Mechanism iteration");
    expect(markup).toContain("Iteration 1");
  });
});
