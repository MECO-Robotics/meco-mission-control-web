/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { RobotMapView } from "../RobotMapView";

const showMap = true;
jest.mock("react", () => {
  const actual = jest.requireActual<typeof React>("react");
  return { ...actual, useState: (initial: unknown) => actual.useState(showMap && initial === "3d" ? "map" : initial) };
});

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RobotMapView drilldowns", () => {
  it("renders subsystem drilldown links for related records", () => {
    const bootstrap = createBootstrap({
      risks: [
        {
          id: "risk-1",
          title: "Bearing fit risk",
          detail: "Tolerance stackup needs review.",
          projectId: "project-a",
          category: "design",
          severity: "medium",
          status: "open",
          blocksWork: false,
          source: { kind: "manual" },
          relatedTargets: [{ kind: "part-instance", id: "part-instance-1" }],
          mitigationTaskId: null,
          ownerGroupId: null,
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          resolvedAt: null,
        },
      ],
      workLogs: [
        {
          id: "worklog-1",
          taskId: "task-1",
          date: "2026-02-03",
          hours: 2,
          participantIds: ["student-1"],
          notes: "Assembled gearbox",
        },
      ],
    });

    const markup = renderToStaticMarkup(
      React.createElement(RobotMapView, {
        bootstrap,
        handleDeleteMechanism: jest.fn(async () => {}),
        onOpenDrilldownTarget: jest.fn(),
        openCreateMechanismModal: jest.fn(),
        openCreatePartInstanceModal: jest.fn(),
        openCreateSubsystemModal: jest.fn(),
        openEditMechanismModal: jest.fn(),
        openEditPartInstanceModal: jest.fn(),
        openEditSubsystemModal: jest.fn(),
        removePartInstanceFromMechanism: jest.fn(async () => true),
        saveSubsystemLayout: jest.fn(async () => true),
        updateSubsystemConfiguration: jest.fn(async () => true),
      }),
    );

    expect(markup).toContain("Linked mechanisms");
    expect(markup).toContain("Gearbox");
    expect(markup).toContain("Linked parts");
    expect(markup).toContain("Bearing Block");
    expect(markup).toContain("Linked tasks");
    expect(markup).toContain("Initial task");
    expect(markup).toContain("Linked risks");
    expect(markup).toContain("Bearing fit risk");
    expect(markup).toContain("Linked worklogs");
    expect(markup).toContain("Assembled gearbox");
  });

  it("renders CAD source indicators in PM object details", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        {
          id: "subsystem-drive",
          projectId: "project-a",
          name: "Drivetrain",
          description: "",
          iteration: 1,
          isCore: true,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          cadImportSource: "STEP_UPLOAD",
        },
      ],
      mechanisms: [
        {
          id: "mechanism-1",
          subsystemId: "subsystem-drive",
          name: "Swerve Modules",
          description: "",
          iteration: 1,
          cadSource: "ONSHAPE_API",
        },
      ],
      partDefinitions: [
        {
          id: "part-def-1",
          seasonId: "season-2026",
          name: "Wheel Module",
          partNumber: "WM-001",
          revision: "A",
          iteration: 1,
          isHardware: false,
          type: "assembly",
          defaultAcquisitionMethod: "manufacture",
          materialId: null,
          description: "",
          cadSource: "STEP_UPLOAD",
        },
      ],
      partInstances: [
        {
          id: "part-instance-1",
          intendedSubsystemId: "subsystem-drive",
          intendedMechanismId: "mechanism-1",
          partDefinitionId: "part-def-1",
          location: { kind: "installed", subsystemId: "subsystem-drive", mechanismId: "mechanism-1" },
          cadEditedAfterImport: true,
        },
      ],
    });

    const markup = renderToStaticMarkup(
      React.createElement(RobotMapView, {
        bootstrap,
        handleDeleteMechanism: jest.fn(async () => {}),
        openCreateMechanismModal: jest.fn(),
        openCreatePartInstanceModal: jest.fn(),
        openCreateSubsystemModal: jest.fn(),
        openEditMechanismModal: jest.fn(),
        openEditPartInstanceModal: jest.fn(),
        openEditSubsystemModal: jest.fn(),
        removePartInstanceFromMechanism: jest.fn(async () => true),
        saveSubsystemLayout: jest.fn(async () => true),
        updateSubsystemConfiguration: jest.fn(async () => true),
      }),
    );

    expect(markup).toContain("STEP import");
    expect(markup).toContain("Onshape sync");
    expect(markup).toContain("Edited after import");
  });

  it("renders subsystem drilldown missing-data states", () => {
    const bootstrap = createBootstrap({
      mechanisms: [],
      partInstances: [],
      risks: [],
      tasks: [],
      workLogs: [],
    });

    const markup = renderToStaticMarkup(
      React.createElement(RobotMapView, {
        bootstrap,
        handleDeleteMechanism: jest.fn(async () => {}),
        onOpenDrilldownTarget: jest.fn(),
        openCreateMechanismModal: jest.fn(),
        openCreatePartInstanceModal: jest.fn(),
        openCreateSubsystemModal: jest.fn(),
        openEditMechanismModal: jest.fn(),
        openEditPartInstanceModal: jest.fn(),
        openEditSubsystemModal: jest.fn(),
        removePartInstanceFromMechanism: jest.fn(async () => true),
        saveSubsystemLayout: jest.fn(async () => true),
        updateSubsystemConfiguration: jest.fn(async () => true),
      }),
    );

    expect(markup).toContain("No linked mechanisms yet.");
    expect(markup).toContain("No linked parts yet.");
    expect(markup).toContain("No linked tasks yet.");
    expect(markup).toContain("No linked risks yet.");
    expect(markup).toContain("No linked worklogs yet.");
  });
});
