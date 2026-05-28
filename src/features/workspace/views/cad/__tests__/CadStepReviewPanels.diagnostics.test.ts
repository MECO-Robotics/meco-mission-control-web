/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP parser diagnostics", () => {
  it("renders detailed STEP parser diagnostics and import metadata near the tree", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: null,
        importRun: {
          id: "cad-import-diagnostics",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          source: "STEP_UPLOAD",
          status: "MAPPING_REVIEW",
          originalFilename: "competition-robot.step",
          uploadedFileHash: "hash",
          parserVersion: "step-text-assembly-parser-2",
          parseStartedAt: "2026-05-10T00:00:00.000Z",
          parseCompletedAt: "2026-05-10T00:00:01.000Z",
          rawSummaryJson: {
            parserMode: "auto",
            productCount: 12,
            assemblyUsageCount: 7,
            nextAssemblyUsageOccurrenceCount: 7,
            rootName: "ASM - Robot",
            rootNames: ["ASM - Robot", "ASM - Practice Bot"],
            topLevelAssemblies: ["SUB - Drivebase", "SUB - Shooter"],
            parserUsedPlaceholder: false,
          },
          createdAt: "2026-05-10T00:00:00.000Z",
          updatedAt: "2026-05-10T00:00:01.000Z",
        },
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-newer",
        mappings: [],
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        snapshot: {
          id: "cad-snapshot-diagnostics",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-diagnostics",
          source: "STEP_UPLOAD",
          label: "Diagnostics snapshot",
          uploadedFileHash: "hash",
          previousSnapshotId: null,
          status: "mapping_review",
          createdBy: null,
          createdAt: "2026-05-10T00:00:02.000Z",
          finalizedBy: null,
          finalizedAt: null,
          notes: null,
        },
        summary: {
          assemblyCount: 3,
          partDefinitionCount: 2,
          partInstanceCount: 4,
          maxDepth: 2,
          parserVersion: "step-text-assembly-parser-2",
          parserMode: "auto",
          productCount: 12,
          assemblyUsageCount: 7,
          nextAssemblyUsageOccurrenceCount: 7,
          rootName: "ASM - Robot",
          rootNames: ["ASM - Robot", "ASM - Practice Bot"],
          topLevelAssemblies: ["SUB - Drivebase", "SUB - Shooter"],
          parserUsedPlaceholder: false,
          warningCount: 0,
          mappingCount: 0,
        },
        targets: {
          subsystems: [],
          mechanisms: [],
          partDefinitions: [],
        },
        tree: [],
        warnings: [],
      }),
    );

    expect(markup).toContain("Parser mode");
    expect(markup).toContain("auto");
    expect(markup).toContain("Product count");
    expect(markup).toContain("12");
    expect(markup).toContain("NEXT_ASSEMBLY_USAGE_OCCURRENCE");
    expect(markup).toContain("7");
    expect(markup).toContain("Root names");
    expect(markup).toContain("ASM - Robot, ASM - Practice Bot");
    expect(markup).toContain("Top-level detected assemblies");
    expect(markup).toContain("SUB - Drivebase, SUB - Shooter");
    expect(markup).toContain("Placeholder used");
    expect(markup).toContain("No");
    expect(markup).toContain("competition-robot.step");
    expect(markup).toContain("You are viewing an older CAD snapshot.");
  });
});
