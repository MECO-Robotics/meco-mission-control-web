/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP review panel mapping state", () => {
  it("renders mapping review state with carry-forward scope and finalize guard", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: {
          previousSnapshotId: "cad-snapshot-1",
          addedAssemblies: [{ id: "asm-intake", name: "MECH - Intake", instancePath: "/Robot/MECH - Intake" }],
          removedAssemblies: [],
          movedAssemblies: [],
          addedParts: [],
          removedParts: [],
          movedPartInstances: [],
          mappingChanges: [],
          warnings: [],
        },
        importRun: null,
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-2",
        mappings: [{
          id: "mapping-1",
          snapshotId: "cad-snapshot-2",
          mappingRuleId: null,
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "cad-assembly-1",
          sourceName: "MECH - Shooter - Flywheel",
          targetKind: "UNMAPPED",
          targetId: null,
          confidence: "LOW",
          status: "NEEDS_REVIEW",
          rule: null,
          updatedAt: "2026-05-10T00:00:00.000Z",
        }],
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        snapshot: {
          id: "cad-snapshot-2",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-2",
          source: "STEP_UPLOAD",
          label: "Iteration 2",
          uploadedFileHash: "hash",
          previousSnapshotId: "cad-snapshot-1",
          status: "mapping_review",
          createdBy: null,
          createdAt: "2026-05-10T00:00:00.000Z",
          finalizedBy: null,
          finalizedAt: null,
          notes: null,
        },
        summary: {
          assemblyCount: 2,
          partDefinitionCount: 1,
          partInstanceCount: 1,
          maxDepth: 2,
          parserVersion: "mock-step-parser-json-1",
          warningCount: 1,
          mappingCount: 3,
        },
        targets: {
          subsystems: [{ id: "subsystem-shooter", projectId: "project-robot-2026", name: "Shooter", description: "", iteration: 1, isCore: false, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [], risks: [] }],
          mechanisms: [{ id: "mechanism-flywheel", subsystemId: "subsystem-shooter", name: "Flywheel", description: "", iteration: 1 }],
          partDefinitions: [{ id: "part-spacer", seasonId: "season-2026", name: "Spacer", partNumber: "SHR-001", revision: "A", iteration: 1, type: "custom", source: "cad", materialId: null, description: "" }],
        },
        tree: [],
        warnings: [{
          id: "warning-1",
          importRunId: "cad-import-2",
          snapshotId: "cad-snapshot-2",
          severity: "WARNING",
          code: "step_unmapped_assembly",
          title: "Assembly is unmapped",
          message: "MECH - Shooter - Flywheel needs review.",
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "cad-assembly-1",
          createdAt: "2026-05-10T00:00:00.000Z",
        }],
      }),
    );

    expect(markup).toContain("MECH - Shooter - Flywheel");
    expect(markup).toContain("This snapshot and future imports");
    expect(markup).toContain("Select a target before confirming.");
    expect(markup).toContain("<button class=\"secondary-button compact-action\" disabled=\"\" type=\"button\">Confirm</button>");
    expect(markup).toContain("Finalize with unresolved warnings");
    expect(markup).toContain("Added assemblies: 1");
    expect(markup).toContain("step_unmapped_assembly");
  });

  it("surfaces parser mode and critical parser warnings in the import summary", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: null,
        importRun: null,
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-parser",
        mappings: [],
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        snapshot: {
          id: "cad-snapshot-parser",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-parser",
          source: "STEP_UPLOAD",
          label: "Parser verification",
          uploadedFileHash: "hash",
          previousSnapshotId: null,
          status: "parsed",
          createdBy: null,
          createdAt: "2026-05-10T00:00:00.000Z",
          finalizedBy: null,
          finalizedAt: null,
          notes: null,
        },
        summary: {
          assemblyCount: 0,
          partDefinitionCount: 0,
          partInstanceCount: 0,
          maxDepth: 0,
          parserVersion: "step-text-assembly-parser-1",
          warningCount: 4,
          mappingCount: 0,
        },
        targets: {
          subsystems: [],
          mechanisms: [],
          partDefinitions: [],
        },
        tree: [],
        warnings: [
          {
            id: "warning-placeholder",
            importRunId: "cad-import-parser",
            snapshotId: "cad-snapshot-parser",
            severity: "ERROR",
            code: "step_parser_placeholder_used",
            title: "Placeholder parser used",
            message: "The STEP import fell back to placeholder output.",
            sourceKind: null,
            sourceId: null,
            createdAt: "2026-05-10T00:00:00.000Z",
          },
          {
            id: "warning-hierarchy",
            importRunId: "cad-import-parser",
            snapshotId: "cad-snapshot-parser",
            severity: "WARNING",
            code: "step_hierarchy_missing",
            title: "STEP hierarchy missing",
            message: "No assembly hierarchy was detected.",
            sourceKind: null,
            sourceId: null,
            createdAt: "2026-05-10T00:00:00.000Z",
          },
          {
            id: "warning-flattened",
            importRunId: "cad-import-parser",
            snapshotId: "cad-snapshot-parser",
            severity: "WARNING",
            code: "step_flattened_file",
            title: "Flattened STEP file",
            message: "The upload appears to be flattened.",
            sourceKind: null,
            sourceId: null,
            createdAt: "2026-05-10T00:00:00.000Z",
          },
          {
            id: "warning-partial",
            importRunId: "cad-import-parser",
            snapshotId: "cad-snapshot-parser",
            severity: "WARNING",
            code: "step_parser_partial",
            title: "Partial STEP parse",
            message: "Only part of the STEP file was parsed.",
            sourceKind: null,
            sourceId: null,
            createdAt: "2026-05-10T00:00:00.000Z",
          },
        ],
      }),
    );

    const carryForwardIndex = markup.indexOf("Carry-forward");

    expect(markup).toContain("step-text-assembly-parser-1");
    expect(markup.indexOf("Placeholder parser output. This is not from your uploaded STEP file.")).toBeGreaterThan(-1);
    expect(markup.indexOf("Placeholder parser output. This is not from your uploaded STEP file.")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_hierarchy_missing")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_flattened_file")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_parser_partial")).toBeLessThan(carryForwardIndex);
  });
});
