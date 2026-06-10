/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { RobotMapView } from "../RobotMapView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RobotMapView", () => {
  it("renders Robot Configuration and avoids readiness-first metrics text", () => {
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
          risks: [],
          layoutX: 0.5,
          layoutY: 0.12,
          layoutZone: "front",
          layoutView: "top",
          sortOrder: 0,
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

    expect(markup).toContain("Robot Configuration");
    expect(markup).toContain("Manual configuration with finalized STEP import and Onshape sync sources.");
    expect(markup).toContain("Source model docs");
    expect(markup).toContain("/docs/CURRENT_WEB_SPEC.md#robot-configuration");
    expect(markup).not.toContain("Unplaced Subsystems");
    expect(markup).not.toContain("All subsystems are currently placed.");
    expect(markup).not.toContain("Enable Edit Layout to drag subsystems.");
    expect(markup).not.toContain("Open tasks");
    expect(markup).not.toContain("Waiting QA");
    expect(markup).not.toContain("MFG open");
    expect(markup).not.toContain("High risk");
  });

  it("shows the Unplaced Subsystems section when at least one subsystem is unplaced", () => {
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
          risks: [],
          layoutX: null,
          layoutY: null,
          layoutZone: "unplaced",
          layoutView: "top",
          sortOrder: 0,
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

    expect(markup).toContain("Unplaced Subsystems");
    expect(markup).toContain("Enable Edit Layout to drag subsystems.");
  });

  it("renders subsystem drilldown links for related records", () => {
    const bootstrap = createBootstrap({
      risks: [
        {
          id: "risk-1",
          title: "Bearing fit risk",
          detail: "Tolerance stackup needs review.",
          severity: "medium",
          sourceType: "test-result",
          sourceId: "test-1",
          attachmentType: "part-instance",
          attachmentId: "part-instance-1",
          mitigationTaskId: null,
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
      manufacturingItems: [
        {
          id: "manufacturing-1",
          title: "Bearing block batch",
          subsystemId: "subsystem-core",
          requestedById: null,
          process: "cnc",
          dueDate: "2026-02-04",
          material: "Aluminum",
          materialId: null,
          partDefinitionId: "part-def-1",
          partInstanceId: "part-instance-1",
          partInstanceIds: ["part-instance-1"],
          quantity: 2,
          status: "approved",
          mentorReviewed: true,
          inHouse: true,
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
    expect(markup).toContain("Left Bearing Block");
    expect(markup).toContain("Linked tasks");
    expect(markup).toContain("Initial task");
    expect(markup).toContain("Linked risks");
    expect(markup).toContain("Bearing fit risk");
    expect(markup).toContain("Linked worklogs");
    expect(markup).toContain("Assembled gearbox");
    expect(markup).toContain("Linked manufacturing");
    expect(markup).toContain("Bearing block batch");
  });

  it("renders subsystem drilldown missing-data states", () => {
    const bootstrap = createBootstrap({
      mechanisms: [],
      manufacturingItems: [],
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
    expect(markup).toContain("No linked manufacturing items yet.");
  });
});
