/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadStepReviewPanels } from "../components/CadStepReviewPanels";

describe("CAD STEP grouped repeated instances", () => {
  it("renders grouped repeated part instances in the tree and mapping review", () => {
    const markup = renderToStaticMarkup(
      React.createElement(CadStepReviewPanels, {
        diff: {
          previousSnapshotId: "cad-snapshot-previous",
          addedAssemblies: [],
          removedAssemblies: [],
          movedAssemblies: [],
          addedParts: [],
          removedParts: [],
          movedPartInstances: [],
          quantityChangedPartGroups: [{
            parentAssemblyName: "MECH - Shooter - Flywheel",
            partName: "PRT - Shooter - Flywheel - Spacer",
            previousQuantity: 3,
            currentQuantity: 4,
            addedInstancePaths: ["/Robot/MECH - Shooter - Flywheel/Spacer <4>"],
            removedInstancePaths: [],
          }],
          mappingChanges: [],
          warnings: [],
        },
        groupRepeatedInstances: true,
        importRun: null,
        isFinalizing: false,
        isSavingMapping: false,
        latestImportRunId: "cad-import-grouped",
        mappings: [{
          id: "part-instance-group:spacer",
          kind: "part_instance_group",
          snapshotId: "cad-snapshot-grouped",
          mappingRuleId: null,
          sourceKind: "PART_INSTANCE",
          sourceId: "cad-part-inst-1",
          sourceIds: ["cad-part-inst-1", "cad-part-inst-2", "cad-part-inst-3", "cad-part-inst-4"],
          sourceName: "PRT - Shooter - Flywheel - Spacer",
          parentAssemblyName: "MECH - Shooter - Flywheel",
          quantity: 4,
          hasMixedMappings: true,
          warning: "Repeated instances have mixed mappings. Review before finalizing.",
          targetKind: "UNMAPPED",
          targetId: null,
          confidence: "LOW",
          status: "NEEDS_REVIEW",
          rule: null,
          updatedAt: "2026-05-10T00:00:00.000Z",
        }, {
          id: "mapping-singleton-plate",
          snapshotId: "cad-snapshot-grouped",
          mappingRuleId: null,
          sourceKind: "PART_INSTANCE",
          sourceId: "cad-part-inst-plate",
          sourceName: "Mounting Plate <1>",
          parentAssemblyName: "MECH - Shooter - Flywheel",
          targetKind: "UNMAPPED",
          targetId: null,
          confidence: "LOW",
          status: "NEEDS_REVIEW",
          rule: null,
          updatedAt: "2026-05-10T00:00:00.000Z",
        }],
        onConfirmMapping: jest.fn(),
        onFinalize: jest.fn(),
        onGroupRepeatedInstancesChange: jest.fn(),
        snapshot: {
          id: "cad-snapshot-grouped",
          projectId: "project-robot-2026",
          seasonId: "season-2026",
          importRunId: "cad-import-grouped",
          source: "STEP_UPLOAD",
          label: "Grouped snapshot",
          uploadedFileHash: "hash",
          previousSnapshotId: "cad-snapshot-previous",
          status: "mapping_review",
          createdBy: null,
          createdAt: "2026-05-10T00:00:02.000Z",
          finalizedBy: null,
          finalizedAt: null,
          notes: null,
        },
        summary: {
          assemblyCount: 1,
          partDefinitionCount: 1,
          partInstanceCount: 4,
          maxDepth: 1,
          parserVersion: "step-text-assembly-parser-1",
          warningCount: 0,
          mappingCount: 4,
        },
        targets: {
          subsystems: [],
          mechanisms: [],
          partDefinitions: [{ id: "part-spacer", seasonId: "season-2026", name: "Spacer", partNumber: "SHR-001", revision: "A", iteration: 1, type: "custom", source: "cad", materialId: null, description: "" }],
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
            kind: "part_instance_group",
            groupId: "part-instance-group:spacer",
            parentAssemblyNodeId: "root",
            partDefinitionId: "part-spacer",
            partDefinition: { id: "part-spacer", name: "PRT - Shooter - Flywheel - Spacer", partNumber: "SHR-001" },
            displayName: "PRT - Shooter - Flywheel - Spacer",
            quantity: 4,
            instanceIds: ["cad-part-inst-1", "cad-part-inst-2", "cad-part-inst-3", "cad-part-inst-4"],
            sourceIds: ["cad-part-inst-1", "cad-part-inst-2", "cad-part-inst-3", "cad-part-inst-4"],
            instancePaths: [
              "/MAIN ASSEMBLY/Spacer <1>",
              "/MAIN ASSEMBLY/Spacer <2>",
              "/MAIN ASSEMBLY/Spacer <3>",
              "/MAIN ASSEMBLY/Spacer <4>",
            ],
            stableSignatures: ["inst:path:/1", "inst:path:/2", "inst:path:/3", "inst:path:/4"],
            mapping: null,
            mappings: [],
            hasMixedMappings: false,
            hasMixedMetadata: false,
            representativeInstanceId: "cad-part-inst-1",
          }, {
            id: "cad-part-inst-plate",
            snapshotId: "cad-snapshot-grouped",
            sourceId: "inst-plate-1",
            partDefinitionId: "part-plate",
            parentAssemblyNodeId: "root",
            instancePath: "/MAIN ASSEMBLY/Mounting Plate <1>",
            quantity: 1,
            stableSignature: "inst:path:/MAIN ASSEMBLY/Mounting Plate <1>",
            metadataJson: {},
            createdAt: "2026-05-10T00:00:00.000Z",
            mapping: null,
            partDefinition: { id: "part-plate", name: "PRT - Shooter - Mounting Plate", partNumber: "SHR-002" },
          }],
          children: [],
        }],
        warnings: [],
      }),
    );

    expect(markup).toContain("Group repeated instances");
    expect(markup).toContain("checked=\"\"");
    expect(markup).toContain("PRT - Shooter - Flywheel - Spacer");
    expect(markup).toContain("×4");
    expect(markup).toContain("Expand PRT - Shooter - Flywheel - Spacer repeated instances");
    expect(markup).toContain("Quantity");
    expect(markup).toContain("Parent assembly");
    expect(markup).toContain("MECH - Shooter - Flywheel");
    expect(markup).toContain("Mixed mappings");
    expect(markup).toContain("Applies to 4 repeated instances");
    expect(markup).toContain("Mounting Plate &lt;1&gt;");
    expect(markup).not.toContain("Applies to 1 repeated instances");
    expect(markup).not.toContain("×1");
    expect(markup).toContain("quantity changed");
    expect(markup).toContain("3 → 4");
  });
});
