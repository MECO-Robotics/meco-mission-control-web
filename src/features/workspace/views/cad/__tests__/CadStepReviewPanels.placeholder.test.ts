/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP placeholder output guards", () => {
  it("blocks finalize and future mapping rules for placeholder STEP output", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: null,
        importRun: null,
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-placeholder",
        mappings: [{
          id: "mapping-placeholder",
          snapshotId: "cad-snapshot-placeholder",
          mappingRuleId: null,
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "cad-assembly-placeholder",
          sourceName: "MECH - Placeholder",
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
          id: "cad-snapshot-placeholder",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-placeholder",
          source: "STEP_UPLOAD",
          label: "Placeholder snapshot",
          uploadedFileHash: "hash",
          previousSnapshotId: null,
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
          maxDepth: 1,
          parserVersion: "mock-step-parser-placeholder-1",
          parserUsedPlaceholder: true,
          warningCount: 1,
          mappingCount: 1,
        },
        targets: {
          subsystems: [],
          mechanisms: [],
          partDefinitions: [],
        },
        tree: [],
        warnings: [{
          id: "warning-placeholder",
          importRunId: "cad-import-placeholder",
          snapshotId: "cad-snapshot-placeholder",
          severity: "ERROR",
          code: "step_parser_placeholder_used",
          title: "Placeholder parser used",
          message: "The STEP import fell back to placeholder output.",
          sourceKind: null,
          sourceId: null,
          createdAt: "2026-05-10T00:00:00.000Z",
        }],
      }),
    );

    expect(markup).toContain("Placeholder parser output. This is not from your uploaded STEP file.");
    expect(markup).toContain("Finalize is blocked for placeholder STEP output.");
    expect(markup).toContain("disabled=\"\"");
    expect(markup).toContain("<button class=\"secondary-button compact-action\" disabled=\"\" type=\"button\">Confirm</button>");
    expect(markup).toContain("Placeholder output cannot be saved as future mapping rules.");
    expect(markup).not.toContain("This snapshot and future imports");
  });
});
