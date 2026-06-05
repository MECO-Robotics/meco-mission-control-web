/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";
import { CadStepMappingReviewTable } from "../components/CadStepMappingReviewTable";

describe("CAD STEP review panel mapping state", () => {
  it("renders carry-forward rule selections and current review choices", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepMappingReviewTable, {
        groupRepeatedInstances: true,
        isSavingMapping: false,
        mappings: [{
          id: "mapping-rule-exact",
          snapshotId: "cad-snapshot-2",
          mappingRuleId: "rule-shooter",
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "cad-assembly-shooter",
          sourceName: "MECH - Shooter",
          targetKind: "MECHANISM",
          targetId: "mechanism-shooter",
          confidence: "HIGH",
          status: "CONFIRMED",
          rule: { id: "rule-shooter", confidence: "HIGH" },
          updatedAt: "2026-05-10T00:00:00.000Z",
        }, {
          id: "mapping-manual",
          snapshotId: "cad-snapshot-2",
          mappingRuleId: null,
          sourceKind: "PART_DEFINITION",
          sourceId: "cad-part-roller",
          sourceName: "Roller tube",
          targetKind: "PART_DEFINITION",
          targetId: "part-roller",
          confidence: "MANUAL",
          status: "CONFIRMED",
          rule: null,
          updatedAt: "2026-05-10T00:00:00.000Z",
        }, {
          id: "mapping-ignore",
          snapshotId: "cad-snapshot-2",
          mappingRuleId: "rule-ignore-fasteners",
          sourceKind: "PART_INSTANCE",
          sourceId: "cad-fastener-1",
          sourceName: "Washer <1>",
          targetKind: "IGNORE",
          targetId: null,
          confidence: "MANUAL",
          status: "CONFIRMED",
          rule: { id: "rule-ignore-fasteners", confidence: "MANUAL" },
          updatedAt: "2026-05-10T00:00:00.000Z",
        }, {
          id: "mapping-ignore-snapshot",
          snapshotId: "cad-snapshot-2",
          mappingRuleId: null,
          sourceKind: "PART_INSTANCE",
          sourceId: "cad-fastener-2",
          sourceName: "Washer <2>",
          targetKind: "IGNORE",
          targetId: null,
          confidence: "MANUAL",
          status: "CONFIRMED",
          rule: null,
          updatedAt: "2026-05-10T00:00:00.000Z",
        }],
        onConfirmMapping: jest.fn(),
        onGroupRepeatedInstancesChange: jest.fn(),
        targets: {
          subsystems: [],
          mechanisms: [{ id: "mechanism-shooter", subsystemId: "subsystem-shooter", name: "Shooter", description: "", iteration: 1 }],
          partDefinitions: [{ id: "part-roller", seasonId: "season-2026", name: "Roller tube", partNumber: "SHR-010", revision: "A", iteration: 1, type: "custom", source: "cad", materialId: null, description: "" }],
        },
        usesPlaceholderParser: false,
      }),
    );

    expect(markup).toContain("Exact name match");
    expect(markup).toContain("Normalized name match");
    expect(markup).toContain("Manual override");
    expect(markup).toContain("Ignore this item");
    expect(markup).toContain("Split/merge deferred");
    expect(markup).toContain("Current: Exact name match; confidence high");
    expect(markup).toContain("Current: Ignore this item; confidence manual");
    expect(markup).toContain("Current: This snapshot only; confidence manual");
    expect(markup).toContain("Review choice: Exact name match for future imports.");
    expect(markup).toContain("Review choice: Manual override for future imports.");
    expect(markup).toContain("Review choice: ignore item.");
  });

  it("renders mapping review state with carry-forward scope and finalize guard", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: {
          previousSnapshotId: "cad-snapshot-1",
          addedAssemblies: [{ id: "asm-intake", name: "MECH - Intake", instancePath: "/Robot/MECH - Intake" }],
          removedAssemblies: [{ id: "asm-old", name: "MECH - Old Shooter", instancePath: "/Robot/MECH - Old Shooter" }],
          movedAssemblies: [],
          addedParts: [{ id: "part-roller", name: "Roller tube", partNumber: "INT-002" }],
          removedParts: [],
          movedPartInstances: [],
          mappingChanges: [{ previousName: "Wheel spacer v1", currentName: "Wheel spacer v2" }],
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
    expect(markup).toContain("Exact name match");
    expect(markup).toContain("Normalized name match");
    expect(markup).toContain("Manual override");
    expect(markup).toContain("Ignore this item");
    expect(markup).toContain("Split/merge deferred");
    expect(markup).toContain("Review choice: This snapshot only before finalize.");
    expect(markup).toContain("multi-source carry-forward rules");
    expect(markup).toContain("Select a target before confirming.");
    expect(markup).toContain("<button class=\"secondary-button compact-action\" disabled=\"\" type=\"button\">Confirm</button>");
    expect(markup).toContain("Finalize with unresolved warnings");
    expect(markup).toContain("STEP preview diff");
    expect(markup).toContain("Review mapping decisions");
    expect(markup).toContain("New subsystems, mechanisms, and parts");
    expect(markup).toContain("MECH - Intake");
    expect(markup).toContain("INT-002 - Roller tube");
    expect(markup).toContain("Renamed or unmatched parts");
    expect(markup).toContain("Wheel spacer v2");
    expect(markup).toContain("Removed or unmapped items");
    expect(markup).toContain("MECH - Old Shooter");
    expect(markup).toContain("Confidence warnings");
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
