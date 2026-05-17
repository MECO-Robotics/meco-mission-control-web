/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP assembly tree rendering", () => {
  it("renders assembly tree item counts with folded child branches", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: null,
        importRun: {
          id: "cad-import-tree",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          source: "STEP_UPLOAD",
          status: "MAPPING_REVIEW",
          originalFilename: "tree.step",
          uploadedFileHash: "hash",
          parserVersion: "step-text-assembly-parser-1",
          parseStartedAt: "2026-05-10T00:00:00.000Z",
          parseCompletedAt: "2026-05-10T00:00:01.000Z",
          rawSummaryJson: {},
          createdAt: "2026-05-10T00:00:00.000Z",
          updatedAt: "2026-05-10T00:00:01.000Z",
        },
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-tree",
        mappings: [],
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        snapshot: {
          id: "cad-snapshot-tree",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-tree",
          source: "STEP_UPLOAD",
          label: "Tree snapshot",
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
          parserVersion: "step-text-assembly-parser-1",
          warningCount: 0,
          mappingCount: 0,
        },
        targets: {
          subsystems: [],
          mechanisms: [],
          partDefinitions: [],
        },
        tree: [{
          id: "root",
          sourceId: "root",
          name: "MAIN ASSEMBLY",
          inferredType: "ROOT",
          instancePath: "/MAIN ASSEMBLY",
          depth: 0,
          mapping: null,
          partInstances: [{
            id: "root-part",
            sourceId: "root-part",
            instancePath: "/MAIN ASSEMBLY/Intake Cheese",
            quantity: 1,
            mapping: null,
            partDefinition: { id: "intake", name: "Intake Cheese", partNumber: null },
          }],
          children: [{
            id: "child",
            sourceId: "child",
            name: "Shooter Main Assembly <1>",
            inferredType: "SUBSYSTEM_CANDIDATE",
            instancePath: "/MAIN ASSEMBLY/Shooter Main Assembly <1>",
            depth: 1,
            mapping: null,
            partInstances: [{
              id: "shooter-part",
              sourceId: "shooter-part",
              instancePath: "/MAIN ASSEMBLY/Shooter Main Assembly <1>/Wheel Spacer",
              quantity: 2,
              mapping: null,
              partDefinition: { id: "spacer", name: "Wheel Spacer", partNumber: null },
            }],
            children: [{
              id: "grandchild",
              sourceId: "grandchild",
              name: "Flywheel Assembly <1>",
              inferredType: "MECHANISM_CANDIDATE",
              instancePath: "/MAIN ASSEMBLY/Shooter Main Assembly <1>/Flywheel Assembly <1>",
              depth: 2,
              mapping: null,
              partInstances: [{
                id: "flywheel-part",
                sourceId: "flywheel-part",
                instancePath: "/MAIN ASSEMBLY/Shooter Main Assembly <1>/Flywheel Assembly <1>/Pulley",
                quantity: 1,
                mapping: null,
                partDefinition: { id: "pulley", name: "Pulley", partNumber: null },
              }],
              children: [],
            }],
          }],
        }],
        warnings: [],
      }),
    );

    expect(markup).toContain("Collapse MAIN ASSEMBLY branch");
    expect(markup).toContain("Expand Shooter Main Assembly &lt;1&gt; branch");
    expect(markup).toContain("2 assemblies");
    expect(markup).toContain("4 parts");
    expect(markup).toContain("1 assembly");
    expect(markup).toContain("3 parts");
    expect(markup).toContain("Shooter Main Assembly &lt;1&gt;");
    expect(markup).not.toContain("Wheel Spacer");
    expect(markup).not.toContain("Flywheel Assembly &lt;1&gt;");
  });
});
