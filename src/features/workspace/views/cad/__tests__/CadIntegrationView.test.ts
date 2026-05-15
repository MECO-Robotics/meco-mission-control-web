/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  CadIntegrationView,
} from "../CadIntegrationView";
import { isMissingCadHierarchyReviewRoute, isMissingCadOptionalRoute } from "../cadOptionalRoutes";
import { uploadCadStepFile } from "../api/cadStepApi";
import { CadStatusPanels } from "../components/CadStatusPanels";
import { CadStepReviewPanels } from "../components/CadStepReviewPanels";
import type { OnshapeOverview } from "../model/cadIntegrationTypes";
import { parseOnshapeUrl } from "../model/onshapeUrlParser";

jest.mock("../api/cadStepApi", () => ({
  fetchCadSnapshots: jest.fn(),
  fetchCadSnapshotSummary: jest.fn(),
  fetchCadSnapshotTree: jest.fn(),
  fetchCadSnapshotMappings: jest.fn(),
  fetchCadHierarchyReview: jest.fn(),
  fetchCadPartMatchProposals: jest.fn(),
  fetchCadSnapshotDiff: jest.fn(),
  fetchCadStepImportRuns: jest.fn(),
  uploadCadStepFile: jest.fn(),
  applyCadHierarchyReview: jest.fn(),
  applyCadSnapshotMappings: jest.fn(),
  finalizeCadSnapshot: jest.fn(),
}));

jest.mock("../api/onshapeCadApi", () => ({
  createOnshapeDocumentRef: jest.fn(),
  createOnshapeOAuthAuthorizationUrl: jest.fn(),
  fetchOnshapeImportEstimate: jest.fn(),
  fetchOnshapeOverview: jest.fn(),
  runOnshapeImport: jest.fn(),
}));

describe("CAD STEP mapper view", () => {
  it("parses common Onshape references for preview without network calls", () => {
    const workspace = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/w/abcdefabcdefabcdefabcdef/e/111111111111111111111111?renderMode=0",
    );
    expect(workspace.ok).toBe(true);
    expect(workspace.referenceType).toBe("workspace");
    expect(workspace.workspaceId).toBe("abcdefabcdefabcdefabcdef");
    expect(workspace.elementId).toBe("111111111111111111111111");

    const version = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/v/222222222222222222222222/e/111111111111111111111111",
    );
    expect(version.referenceType).toBe("version");
    expect(version.versionId).toBe("222222222222222222222222");

    const microversion = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/m/333333333333333333333333/e/111111111111111111111111",
    );
    expect(microversion.referenceType).toBe("microversion");
    expect(microversion.microversionId).toBe("333333333333333333333333");

    const missingElement = parseOnshapeUrl(
      "https://cad.onshape.com/documents/0123456789abcdef01234567/v/222222222222222222222222",
    );
    expect(missingElement.ok).toBe(true);
    expect(missingElement.errors.join(" ")).toMatch(/elementId/);

    expect(parseOnshapeUrl("https://example.com/documents/x/w/y/e/z").ok).toBe(false);
    expect(parseOnshapeUrl("not-a-url").ok).toBe(false);
  });

  it("renders the STEP import workflow before the secondary Onshape sync section", () => {
    const markup = renderToStaticMarkup(React.createElement(CadIntegrationView, {}));

    expect(markup).toContain("STEP import");
    expect(markup).toContain("Export from the master assembly");
    expect(markup).toContain("MECH - Drivetrain - Swerve Module");
    expect(markup).toContain("CAD / Onshape integration");
    expect(markup).toContain("Onshape status");
    expect(markup).toContain("API budget");
    expect(markup.indexOf("STEP import")).toBeLessThan(markup.indexOf("CAD / Onshape integration"));
    expect(uploadCadStepFile).not.toHaveBeenCalled();
  });

  it("renders OAuth2 connection state without exposing token values", () => {
    const overview: OnshapeOverview = {
      connection: {
        authMode: "oauth",
        baseUrl: "https://cad.onshape.com",
        configured: true,
        credentialReference: "onshape-oauth",
        lastError: null,
        oauth: {
          clientConfigured: true,
          connected: true,
          authorizationUrlAvailable: true,
          scopes: ["OAuth2Read"],
          tokenExpiresAt: "2026-05-10T12:00:00.000Z",
          credentialSource: "runtime",
        },
      },
      documentRefs: [],
      importRuns: [],
      snapshots: [],
      latestSnapshot: null,
      assemblyNodes: [],
      partDefinitions: [],
      partInstances: [],
      warnings: [],
      budget: {
        planType: "education",
        dailySoftBudget: 100,
        perSyncSoftBudget: 25,
        callsUsedToday: 0,
        callsUsedThisMonth: 0,
        callsUsedThisYear: 0,
        warningThresholdPercent: 70,
        hardStopThresholdPercent: 90,
        lastRateLimitRemaining: null,
      },
    };

    const markup = renderToStaticMarkup(
      React.createElement(CadStatusPanels, {
        overview,
        selectedReferenceType: "version",
        selectedSyncLevel: "bom",
        syncEstimate: null,
        onConnectOAuth: jest.fn(),
      }),
    );

    expect(markup).toContain("OAuth2 connected");
    expect(markup).toContain("runtime token");
    expect(markup).toContain("OAuth2Read");
    expect(markup).not.toContain("oauth-access-token");
  });

  it("treats only the missing hierarchy route response as optional", () => {
    const routeError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/hierarchy-review not found"),
      { statusCode: 404 },
    );
    const proposalsRouteError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/part-match-proposals not found"),
      { statusCode: 404 },
    );
    const diffRouteError = Object.assign(
      new Error("Route GET:/api/cad/snapshots/cad-snapshot-0003/diff not found"),
      { statusCode: 404 },
    );
    const snapshotError = Object.assign(new Error("CAD snapshot was not found."), { statusCode: 404 });
    const serverError = Object.assign(new Error("Server Error"), { statusCode: 500 });

    expect(isMissingCadHierarchyReviewRoute(routeError)).toBe(true);
    expect(isMissingCadOptionalRoute(proposalsRouteError, "/part-match-proposals")).toBe(true);
    expect(isMissingCadOptionalRoute(diffRouteError, "/diff")).toBe(true);
    expect(isMissingCadHierarchyReviewRoute(snapshotError)).toBe(false);
    expect(isMissingCadOptionalRoute(snapshotError, "/diff")).toBe(false);
    expect(isMissingCadHierarchyReviewRoute(serverError)).toBe(false);
    expect(isMissingCadOptionalRoute(serverError, "/part-match-proposals")).toBe(false);
  });

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
