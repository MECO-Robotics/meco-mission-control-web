/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { RobotMapView } from "../RobotMapView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RobotMapView", () => {
  it("keeps the robot view free of duplicated configuration copy and readiness-first metrics", () => {
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

    expect(markup).toContain("Empty 3D viewer");
    expect(markup).not.toContain("<h2>Robot Configuration</h2>");
    expect(markup).not.toContain("Upload an isometric layout image");
    expect(markup).not.toContain("Inspect the robot assembly in 3D.");
    expect(markup).not.toContain("Map View");
    expect(markup).not.toContain("List View");
    expect(markup).not.toContain("3D View");
    expect(markup).toContain('aria-label="Import CAD"');
    expect(markup).toContain('data-tutorial-target="import-cad-button"');
    expect(markup).not.toContain('aria-label="Map presentation"');
    expect(markup).not.toContain('aria-label="Upload isometric image"');
    expect(markup).not.toContain("robot-config-cad-viewer");
    expect(markup.indexOf('class="robot-config-map-surface')).toBeLessThan(
      markup.indexOf('class="robot-config-embedded-cad'),
    );
    expect(markup).not.toContain("Manual configuration with finalized STEP import and Onshape sync sources.");
    expect(markup).not.toContain("Source model docs");
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

});
