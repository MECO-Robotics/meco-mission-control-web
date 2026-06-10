/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";
import { baseHierarchyReview } from "./cadStepHierarchyReviewTestHelpers";
import { buildCadStepPreviewDiffViewModel } from "../model/cadStepPreviewDiffViewModel";

describe("CAD STEP review preview diff", () => {
  it("shows preview states and mapping return before finalize", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: {
          previousSnapshotId: "snapshot-previous",
          addedAssemblies: [{ id: "asm-subsystem", name: "SUB - Climber", instancePath: "/Robot/SUB - Climber" }],
          removedAssemblies: [{ id: "asm-removed", name: "MECH - Legacy Hook", instancePath: "/Robot/MECH - Legacy Hook" }],
          movedAssemblies: [{
            name: "MECH - Hook Actuator",
            previousParentSourceId: "asm-old-climber",
            currentParentSourceId: "asm-new-climber",
          }],
          addedParts: [{ id: "part-hook", name: "Hook plate", partNumber: "CLB-001" }],
          removedParts: [{ id: "part-old", name: "Old hook", partNumber: "CLB-000" }],
          movedPartInstances: [{
            sourceId: "part-instance-hook-pin",
            previousParentAssemblyName: "MECH - Legacy Hook",
            currentParentAssemblyName: "MECH - Hook Actuator",
          }],
          mappingChanges: [{ previousName: "Hook plate rev A", currentName: "Hook plate rev B" }],
          warnings: [{
            id: "warning-low-confidence",
            importRunId: "import-current",
            snapshotId: "snapshot-current",
            severity: "WARNING",
            code: "cad_low_confidence_match",
            title: "Low confidence match",
            message: "Hook plate may match multiple parts.",
            sourceKind: "PART_DEFINITION",
            sourceId: "part-hook",
            createdAt: "2026-05-15T00:00:00.000Z",
          }],
        },
        hierarchyReview: baseHierarchyReview(),
        importRun: null,
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "import-current",
        mappings: [{
          id: "mapping-unmatched",
          snapshotId: "snapshot-current",
          mappingRuleId: null,
          sourceKind: "PART_DEFINITION",
          sourceId: "part-hook",
          sourceName: "Hook plate rev B",
          targetKind: "UNMAPPED",
          targetId: null,
          confidence: "LOW",
          status: "NEEDS_REVIEW",
          rule: null,
          updatedAt: "2026-05-15T00:00:00.000Z",
        }],
        onConfirmHierarchyDecision: jest.fn(),
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        partMatchProposals: [{
          id: "proposal-hook",
          hierarchyNodeId: "part-hook",
          sourcePartName: "Hook plate rev B",
          candidates: [],
          status: "NO_MATCH",
        }],
        snapshot: {
          id: "snapshot-current",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "import-current",
          source: "STEP_UPLOAD",
          label: "Climber import",
          uploadedFileHash: "hash",
          previousSnapshotId: "snapshot-previous",
          status: "mapping_review",
          createdBy: null,
          createdAt: "2026-05-15T00:00:00.000Z",
          finalizedBy: null,
          finalizedAt: null,
          notes: null,
        },
        summary: null,
        targets: { subsystems: [], mechanisms: [], partDefinitions: [] },
        tree: [],
        warnings: [],
      }),
    );

    expect(markup).toContain("Review import impact");
    expect(markup).toContain("SUB - Climber");
    expect(markup).toContain("CLB-001 - Hook plate");
    expect(markup).toContain("Hook plate rev B");
    expect(markup).toContain("MECH - Hook Actuator");
    expect(markup).toContain("part-instance-hook-pin");
    expect(markup).toContain("MECH - Legacy Hook");
    expect(markup).toContain("CLB-000 - Old hook");
    expect(markup).toContain("Low confidence match");
    expect(markup).toContain("Review mapping decisions");
    expect(markup).toContain("Finalize with unresolved warnings");
  });

  it("preserves distinct duplicate-named STEP parts in preview counts", () => {
    const groups = buildCadStepPreviewDiffViewModel({
      diff: {
        previousSnapshotId: null,
        addedAssemblies: [],
        removedAssemblies: [],
        movedAssemblies: [],
        addedParts: [
          { id: "part-left-plate", name: "Side plate", partNumber: null },
          { id: "part-right-plate", name: "Side plate", partNumber: null },
        ],
        removedParts: [],
        movedPartInstances: [],
        mappingChanges: [],
        warnings: [],
      },
      hierarchyReview: null,
      mappings: [],
      partMatchProposals: [],
      warnings: [],
    });

    expect(groups[0].items.map((item) => item.id)).toEqual(["added-part-part-left-plate", "added-part-part-right-plate"]);
  });

  it("counts unmapped STEP mappings only in the removed or unmapped group", () => {
    const groups = buildCadStepPreviewDiffViewModel({
      diff: {
        previousSnapshotId: null,
        addedAssemblies: [],
        removedAssemblies: [],
        movedAssemblies: [],
        addedParts: [],
        removedParts: [],
        movedPartInstances: [],
        mappingChanges: [],
        warnings: [],
      },
      hierarchyReview: null,
      mappings: [{
        id: "mapping-unmapped-arm",
        snapshotId: "snapshot-current",
        mappingRuleId: null,
        sourceKind: "PART_DEFINITION",
        sourceId: "part-arm",
        sourceName: "Arm spacer",
        targetKind: "UNMAPPED",
        targetId: null,
        confidence: "LOW",
        status: "NEEDS_REVIEW",
        rule: null,
        updatedAt: "2026-05-15T00:00:00.000Z",
      }],
      partMatchProposals: [],
      warnings: [],
    });

    expect(groups.find((group) => group.id === "renamed")?.items).toEqual([]);
    expect(groups.find((group) => group.id === "removed")?.items.map((item) => item.id)).toEqual(["unmapped-mapping-unmapped-arm"]);
  });
});
