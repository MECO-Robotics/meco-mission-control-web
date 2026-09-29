/// <reference types="jest" />

import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { buildRobotConfigurationViewModel } from "../robotMapViewModel";
import { RobotMapUnplacedModal } from "../RobotMapUnplacedModal";
import { RobotMapView } from "../RobotMapView";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("RobotMapView", () => {
  it("shows subsystem placement and layout actions inside the unplaced modal", () => {
    const subsystem = buildRobotConfigurationViewModel(createBootstrap(), "").subsystems[0];
    const markup = renderToStaticMarkup(
      React.createElement(RobotMapUnplacedModal, {
        onAddSubsystem: jest.fn(),
        onAutoArrange: jest.fn(),
        onClose: jest.fn(),
        onPlaceSubsystem: jest.fn(),
        onResetLayout: jest.fn(),
        onSelectSubsystem: jest.fn(),
        selectedSubsystemId: null,
        subsystems: [subsystem],
      }),
    );

    expect(markup).toContain('aria-label="Unplaced subsystems"');
    expect(markup).toContain("Place");
    expect(markup).toContain("Auto-arrange");
    expect(markup).toContain("Reset");
  });

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

  it("keeps the embedded CAD controls interactive over the click-through overlay", () => {
    const css = readFileSync("src/app/styles/workspace/robotMap.css", "utf8");

    expect(css).toMatch(/\.robot-config-embedded-cad\s*\{[^}]*pointer-events:\s*none;/);
    expect(css).toMatch(
      /\.robot-config-embedded-cad \.cad-local-viewer-embedded\s*\{[^}]*pointer-events:\s*auto;/,
    );
    expect(css).toMatch(
      /\.robot-config-embedded-cad \.cad-part-viewer\s*\{[^}]*pointer-events:\s*auto;/,
    );
  });

  it("opens unplaced subsystem management from the robot viewport instead of expanding it inline", () => {
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

    expect(markup).toContain('aria-label="Show 1 unplaced subsystems"');
    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).not.toContain('class="robot-config-unplaced"');
    expect(markup).not.toContain("robot-config-unplaced-grid");
  });

});
