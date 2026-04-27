/// <reference types="jest" />

import * as React from "react";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MaterialEditorModal,
  ManufacturingEditorModal,
  MechanismEditorModal,
  PartDefinitionEditorModal,
  SubsystemEditorModal,
  TaskEditorModal,
} from "@/features/workspace/WorkspaceModals";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared";
import { buildEmptyManufacturingPayload, buildEmptyTaskPayload } from "@/lib/appUtils";
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
    dependencyIds: [],
    blockers: [],
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
      taskModalMode,
      setTaskDraft: jest.fn(),
    }),
  );
}

function renderIterationEditors(mode: "create" | "edit") {
  const bootstrap = createBootstrap();
  const noop = jest.fn();

  return [
    renderToStaticMarkup(
      React.createElement(PartDefinitionEditorModal, {
        activePartDefinitionId: mode === "edit" ? "part-definition-1" : null,
        bootstrap,
        closePartDefinitionModal: noop,
        handleDeletePartDefinition: noop,
        handleTogglePartDefinitionArchived: noop,
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
        partDefinitionModalMode: mode,
        setPartDefinitionDraft: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(SubsystemEditorModal, {
        activeSubsystemId: mode === "edit" ? "subsystem-1" : null,
        bootstrap,
        closeSubsystemModal: noop,
        handleToggleSubsystemArchived: noop,
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
        subsystemModalMode: mode,
        setSubsystemDraft: noop,
        setSubsystemDraftRisks: noop,
      }),
    ),
    renderToStaticMarkup(
      React.createElement(MechanismEditorModal, {
        activeMechanismId: mode === "edit" ? "mechanism-1" : null,
        bootstrap,
        closeMechanismModal: noop,
        handleDeleteMechanism: noop,
        handleToggleMechanismArchived: noop,
        handleMechanismSubmit: noop,
        isDeletingMechanism: false,
        isSavingMechanism: false,
        mechanismDraft: {
          subsystemId: "subsystem-1",
          name: "Gearbox",
          description: "Drive gearbox",
          iteration: 1,
        },
        mechanismModalMode: mode,
        setMechanismDraft: noop,
      }),
    ),
  ].join("");
}

function renderManufacturingModal(
  process: "cnc" | "3d-print" | "fabrication",
  manufacturingModalMode: "create" | "edit" = "create",
) {
  const bootstrap = createBootstrap();

  return renderToStaticMarkup(
    React.createElement(ManufacturingEditorModal, {
      bootstrap,
      closeManufacturingModal: jest.fn(),
      handleManufacturingSubmit: jest.fn(),
      isSavingManufacturing: false,
      manufacturingDraft: {
        ...buildEmptyManufacturingPayload(bootstrap, process),
        process,
      },
      manufacturingModalMode,
      setManufacturingDraft: jest.fn(),
    }),
  );
}

function renderMaterialModal(materialModalMode: "create" | "edit") {
  return renderToStaticMarkup(
    React.createElement(MaterialEditorModal, {
      activeMaterialId: materialModalMode === "edit" ? "material-1" : null,
      closeMaterialModal: jest.fn(),
      handleDeleteMaterial: jest.fn(),
      handleMaterialSubmit: jest.fn(),
      isDeletingMaterial: false,
      isSavingMaterial: false,
      materialDraft: {
        name: "Aluminum 6061",
        category: "metal",
        unit: "sheet",
        onHandQuantity: 12,
        reorderPoint: 6,
        location: "Rack A",
        vendor: "McMaster",
        notes: "",
      },
      materialModalMode,
      setMaterialDraft: jest.fn(),
    }),
  );
}

function renderManufacturingModalWithPartInstances(process: "cnc" | "3d-print" | "fabrication") {
  const bootstrap: BootstrapPayload = {
    ...createBootstrap(),
    mechanisms: [
      {
        id: "mechanism-1",
        subsystemId: "subsystem-1",
        name: "Gearbox",
        description: "",
        iteration: 1,
      },
    ],
    materials: [
      {
        id: "material-1",
        name: "Aluminum 6061",
        category: "metal",
        unit: "bar",
        onHandQuantity: 4,
        reorderPoint: 1,
        location: "Rack",
        vendor: "",
        notes: "",
      },
    ],
    partDefinitions: [
      {
        id: "part-definition-1",
        name: "Bearing Block",
        partNumber: "BB-001",
        revision: "A",
        iteration: 1,
        type: "custom",
        source: "Onshape",
        materialId: "material-1",
        description: "",
      },
    ],
    partInstances: [
      {
        id: "part-instance-1",
        subsystemId: "subsystem-1",
        mechanismId: "mechanism-1",
        partDefinitionId: "part-definition-1",
        name: "Left Bearing Block",
        quantity: 2,
        trackIndividually: false,
        status: "planned",
      },
    ],
  };

  return renderToStaticMarkup(
    React.createElement(ManufacturingEditorModal, {
      bootstrap,
      closeManufacturingModal: jest.fn(),
      handleManufacturingSubmit: jest.fn(),
      isSavingManufacturing: false,
      manufacturingDraft: buildEmptyManufacturingPayload(bootstrap, process),
      manufacturingModalMode: "create",
      setManufacturingDraft: jest.fn(),
    }),
  );
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

  it("shows dependency controls in the task editor", () => {
    const markup = renderTaskModal("edit");

    expect(markup).toContain("Dependencies");
    expect(markup).toContain("Depends on");
    expect(markup).toContain("Dependency type");
  });

  it("hides iteration selectors while creating definition editors", () => {
    const markup = renderIterationEditors("create");

    expect(markup).not.toContain(">Iteration</span>");
  });

  it("renders iteration selectors for definition editors in edit mode", () => {
    const markup = renderIterationEditors("edit");

    expect(markup).toContain(">Iteration</span>");
    expect(markup).toContain("v1");
  });

  it("renders the in-house checkbox only for CNC manufacturing jobs", () => {
    expect(renderManufacturingModal("cnc")).toContain("In-house");
    expect(renderManufacturingModal("3d-print")).not.toContain("In-house");
    expect(renderManufacturingModal("fabrication")).not.toContain("In-house");
  });

  it("hides mentor reviewed in create mode but keeps it in edit mode", () => {
    expect(renderManufacturingModal("cnc", "create")).not.toContain("Mentor reviewed");
    expect(renderManufacturingModal("cnc", "edit")).toContain("Mentor reviewed");
  });

  it("starts manufacturing creation with part definition and scoped part instances", () => {
    (["cnc", "3d-print", "fabrication"] as const).forEach((process) => {
      const markup = renderManufacturingModalWithPartInstances(process);

      expect(markup.indexOf("Part definition")).toBeGreaterThan(-1);
      expect(markup.indexOf("Part definition")).toBeLessThan(markup.indexOf("Requester"));
      expect(markup).toContain("Part instances");
      expect(markup).toContain("Drive / Gearbox");
      expect(markup).not.toContain(">Title</span>");
      expect(markup).not.toContain(">Subsystem</span>");
      expect(markup).not.toContain(">Process</span>");
    });
  });

  it("hides the unit field in material create and edit modals", () => {
    expect(renderMaterialModal("create")).not.toContain(">Unit</span>");
    expect(renderMaterialModal("edit")).not.toContain(">Unit</span>");
  });
});
