/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP parser warnings", () => {
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

    expect(markup).toContain("Source");
    expect(markup).toContain("STEP import");
    expect(markup).toContain("Preview only");
    expect(markup).toContain("step-text-assembly-parser-1");
    expect(markup.indexOf("Placeholder parser output. This is not from your uploaded STEP file.")).toBeGreaterThan(-1);
    expect(markup.indexOf("Placeholder parser output. This is not from your uploaded STEP file.")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_hierarchy_missing")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_flattened_file")).toBeLessThan(carryForwardIndex);
    expect(markup.indexOf("step_parser_partial")).toBeLessThan(carryForwardIndex);
  });
});
