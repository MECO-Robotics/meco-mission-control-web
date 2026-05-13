/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { applyCadHierarchyReview } from "../api/cadStepApi";
import { CadStepHierarchyNodeCard } from "../components/CadStepHierarchyNodeCard";
import { CadStepReviewPanels } from "../components/CadStepReviewPanels";
import type { CadHierarchyStage } from "../components/CadStepHierarchyReviewPanel";
import type {
  CadHierarchyNode,
  CadHierarchyReview,
  CadHierarchyReviewDecision,
  CadHierarchyTargetKind,
} from "../model/cadIntegrationTypes";

const requestApiMock = jest.fn();

jest.mock("@/lib/auth/core/request", () => ({
  requestApi: (...args: unknown[]) => requestApiMock(...args),
}));

function baseHierarchyReview(overrides: Partial<CadHierarchyReview> = {}): CadHierarchyReview {
  return {
    snapshotId: "snapshot-hierarchy",
    root: {
      id: "root",
      sourceKind: "ASSEMBLY_NODE",
      sourceId: "asm-root",
      name: "Robot Root",
      instancePath: "/Robot Root",
      inferredType: "ROOT",
      proposedClassification: "ROOT",
      resolvedSubsystemId: null,
      resolvedMechanismId: null,
      resolvedComponentAssemblyId: null,
      resolvedPartDefinitionId: null,
      confidence: "HIGH",
      status: "PROPOSED",
      partSummary: {
        rawInstanceCount: 612,
        groupedPartCount: 18,
        matchedExistingDefinitionCount: 9,
        proposedNewDefinitionCount: 5,
        ambiguousMatchCount: 4,
        unresolvedCount: 6,
      },
      children: [
        {
          id: "subsystem-drive",
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "asm-drive",
          name: "SUB - Drivebase",
          instancePath: "/Robot Root/SUB - Drivebase",
          inferredType: "SUBSYSTEM_CANDIDATE",
          proposedClassification: "SUBSYSTEM",
          resolvedSubsystemId: "subsystem-drive",
          resolvedMechanismId: null,
          resolvedComponentAssemblyId: null,
          resolvedPartDefinitionId: null,
          confidence: "HIGH",
          status: "PROPOSED",
          partSummary: {
            rawInstanceCount: 300,
            groupedPartCount: 8,
            matchedExistingDefinitionCount: 5,
            proposedNewDefinitionCount: 1,
            ambiguousMatchCount: 2,
            unresolvedCount: 1,
          },
          children: [
            {
              id: "mechanism-module",
              sourceKind: "ASSEMBLY_NODE",
              sourceId: "asm-module",
              name: "MECH - Swerve Module",
              instancePath: "/Robot Root/SUB - Drivebase/MECH - Swerve Module",
              inferredType: "MECHANISM_CANDIDATE",
              proposedClassification: "MECHANISM",
              resolvedSubsystemId: "subsystem-drive",
              resolvedMechanismId: "mechanism-module",
              resolvedComponentAssemblyId: null,
              resolvedPartDefinitionId: null,
              confidence: "MEDIUM",
              status: "NEEDS_REVIEW",
              partSummary: {
                rawInstanceCount: 144,
                groupedPartCount: 6,
                matchedExistingDefinitionCount: 4,
                proposedNewDefinitionCount: 0,
                ambiguousMatchCount: 2,
                unresolvedCount: 1,
              },
              children: [
                {
                  id: "component-gearbox",
                  sourceKind: "ASSEMBLY_NODE",
                  sourceId: "asm-gearbox",
                  name: "COMP - Gearbox",
                  instancePath: "/Robot Root/SUB - Drivebase/MECH - Swerve Module/COMP - Gearbox",
                  inferredType: "COMPONENT_CANDIDATE",
                  proposedClassification: "COMPONENT_ASSEMBLY",
                  resolvedSubsystemId: "subsystem-drive",
                  resolvedMechanismId: "mechanism-module",
                  resolvedComponentAssemblyId: null,
                  resolvedPartDefinitionId: null,
                  confidence: "MEDIUM",
                  status: "NEEDS_REVIEW",
                  partSummary: {
                    rawInstanceCount: 24,
                    groupedPartCount: 3,
                    matchedExistingDefinitionCount: 2,
                    proposedNewDefinitionCount: 0,
                    ambiguousMatchCount: 1,
                    unresolvedCount: 1,
                  },
                  children: [],
                },
                {
                  id: "part-wheel",
                  sourceKind: "PART_INSTANCE",
                  sourceId: "part-wheel",
                  name: "Wheel tread",
                  instancePath: "/Robot Root/SUB - Drivebase/MECH - Swerve Module/Wheel tread",
                  inferredType: "PART_CANDIDATE",
                  proposedClassification: "PART",
                  resolvedSubsystemId: "subsystem-drive",
                  resolvedMechanismId: "mechanism-module",
                  resolvedComponentAssemblyId: null,
                  resolvedPartDefinitionId: "part-wheel",
                  confidence: "LOW",
                  status: "NEEDS_REVIEW",
                  partSummary: {
                    rawInstanceCount: 48,
                    groupedPartCount: 1,
                    matchedExistingDefinitionCount: 0,
                    proposedNewDefinitionCount: 0,
                    ambiguousMatchCount: 1,
                    unresolvedCount: 1,
                  },
                  children: [],
                },
              ],
            },
          ],
        },
        {
          id: "subsystem-intake",
          sourceKind: "ASSEMBLY_NODE",
          sourceId: "asm-intake",
          name: "SUB - Intake",
          instancePath: "/Robot Root/SUB - Intake",
          inferredType: "SUBSYSTEM_CANDIDATE",
          proposedClassification: "SUBSYSTEM",
          resolvedSubsystemId: null,
          resolvedMechanismId: null,
          resolvedComponentAssemblyId: null,
          resolvedPartDefinitionId: null,
          confidence: "MEDIUM",
          status: "NEEDS_REVIEW",
          partSummary: {
            rawInstanceCount: 124,
            groupedPartCount: 5,
            matchedExistingDefinitionCount: 3,
            proposedNewDefinitionCount: 1,
            ambiguousMatchCount: 1,
            unresolvedCount: 2,
          },
          children: [],
        },
      ],
    },
    unresolved: [{
      code: "cad_part_match_ambiguous",
      title: "Ambiguous part match",
      message: "Wheel tread needs a part definition match decision.",
      severity: "BLOCKING",
      sourceKind: "PART_INSTANCE",
      sourceId: "part-wheel",
    }],
    partMatchProposals: [
      {
        id: "proposal-wheel",
        hierarchyNodeId: "part-wheel",
        sourcePartName: "Wheel tread",
        parentHierarchyName: "MECH - Swerve Module",
        candidates: [
          { partDefinitionId: "part-wheel", label: "WHD-001 - Wheel tread", confidence: "LOW", reason: "name match" },
          { partDefinitionId: "part-tread", label: "WHD-002 - Practice tread", confidence: "LOW", reason: "similar name" },
        ],
        status: "AMBIGUOUS",
      },
    ],
    warnings: [{ code: "cad_hierarchy_unresolved", title: "Unresolved hierarchy", message: "One part still needs review.", severity: "WARNING" }],
    ...overrides,
  };
}

function baseHierarchyTargets() {
  return {
    subsystems: [{ id: "subsystem-drive", projectId: "project-robot", name: "Drivebase", description: "", iteration: 1, isCore: true, parentSubsystemId: null, responsibleEngineerId: null, mentorIds: [], risks: [] }],
    mechanisms: [{ id: "mechanism-module", subsystemId: "subsystem-drive", name: "Swerve Module", description: "", iteration: 1 }],
    partDefinitions: [{ id: "part-wheel", seasonId: "season-2026", name: "Wheel tread", partNumber: "WHD-001", revision: "A", iteration: 1, type: "custom", source: "cad", materialId: null, description: "" }],
  };
}

function renderNodeCardMarkup(node: CadHierarchyNode, targetKind: CadHierarchyTargetKind) {
  return renderToStaticMarkup(
    React.createElement(CadStepHierarchyNodeCard, {
      node,
      onConfirm: jest.fn(),
      targets: baseHierarchyTargets(),
      targetKind,
    }),
  );
}

function renderHierarchyMarkup(stage: CadHierarchyStage = "subsystems", hierarchyReview = baseHierarchyReview()) {
  return renderToStaticMarkup(
    React.createElement(CadStepReviewPanels, {
      diff: null,
      hierarchyReview,
      initialHierarchyStage: stage,
      importRun: null,
      isFinalizing: false,
      isSavingMapping: false,
      latestImportRunId: "cad-import-hierarchy",
      mappings: [{
        id: "flat-mapping-hidden",
        snapshotId: "snapshot-hierarchy",
        mappingRuleId: null,
        sourceKind: "PART_INSTANCE",
        sourceId: "flat-part",
        sourceName: "Flat debug part",
        parentAssemblyName: "Flat debug assembly",
        targetKind: "UNMAPPED",
        targetId: null,
        confidence: "LOW",
        status: "NEEDS_REVIEW",
        rule: null,
        updatedAt: "2026-05-11T00:00:00.000Z",
      }],
      onConfirmHierarchyDecision: jest.fn(),
      onConfirmMapping: jest.fn(),
      onFinalize: jest.fn(),
      snapshot: null,
      summary: null,
      targets: baseHierarchyTargets(),
      tree: [],
      warnings: [],
    }),
  );
}

describe("CAD STEP hierarchy review workflow", () => {
  it("starts subsystem review at the first layer under root and keeps child assemblies out of that stage", () => {
    const markup = renderHierarchyMarkup();

    expect(markup).toContain("Subsystems");
    expect(markup).toContain("SUB - Drivebase");
    expect(markup).toContain("SUB - Intake");
    expect(markup).not.toContain("MECH - Swerve Module");
    expect(markup).not.toContain("Flat debug part");
  });

  it("renders mechanism and component assembly review with parent selectors", () => {
    const markup = renderHierarchyMarkup("mechanisms");

    expect(markup).toContain("Mechanisms/components");
    expect(markup).toContain("Child assemblies");
    expect(markup).toContain("MECH - Swerve Module");
    expect(markup).toContain("Parent subsystem");
    expect(markup).toContain("Existing mechanism");
    expect(markup).toContain("COMP - Gearbox");
    expect(markup).toContain("Parent mechanism");
    expect(markup).toContain("Component assembly");
    expect(markup).toContain("Drivebase");
    expect(markup).toContain("Swerve Module");
  });

  it("preserves nested subsystem proposals in the mechanisms stage", () => {
    const hierarchyReview = baseHierarchyReview();
    const driveSubsystem = hierarchyReview.root?.children.find((node) => node.id === "subsystem-drive");

    if (!driveSubsystem) {
      throw new Error("Missing drive subsystem fixture");
    }

    driveSubsystem.children = [{
      id: "nested-subsystem-climber",
      sourceKind: "ASSEMBLY_NODE",
      sourceId: "asm-climber",
      name: "SUB - Climber",
      instancePath: "/Robot Root/SUB - Drivebase/SUB - Climber",
      inferredType: "SUBSYSTEM_CANDIDATE",
      proposedClassification: "SUBSYSTEM",
      resolvedSubsystemId: "subsystem-drive",
      resolvedMechanismId: null,
      resolvedComponentAssemblyId: null,
      resolvedPartDefinitionId: null,
      confidence: "MEDIUM",
      status: "NEEDS_REVIEW",
      partSummary: {
        rawInstanceCount: 42,
        groupedPartCount: 4,
        matchedExistingDefinitionCount: 0,
        proposedNewDefinitionCount: 1,
        ambiguousMatchCount: 0,
        unresolvedCount: 0,
      },
      children: [],
    }];

    const markup = renderHierarchyMarkup("mechanisms", hierarchyReview);

    expect(markup).toContain("SUB - Climber");
    expect(markup).toContain("Existing subsystem");
    expect(markup).not.toContain("Existing mechanism");
    expect(markup).not.toContain("Parent subsystem");
  });

  it("blocks target-backed hierarchy confirmations until a target is selected", () => {
    const hierarchyReview = baseHierarchyReview();
    const unresolvedSubsystem = hierarchyReview.root?.children.find((node) => node.id === "subsystem-intake");

    if (!unresolvedSubsystem) {
      throw new Error("Missing unresolved subsystem fixture");
    }

    const markup = renderNodeCardMarkup(unresolvedSubsystem, "SUBSYSTEM");

    expect(markup).toContain('<button class="secondary-button compact-action" disabled="" type="button">Confirm</button>');
  });

  it("keeps component assembly confirmations available without a hierarchy target", () => {
    const hierarchyReview = baseHierarchyReview();
    const mechanismNode = hierarchyReview.root?.children[0]?.children[0];
    const componentNode = mechanismNode?.children.find((node) => node.id === "component-gearbox");

    if (!componentNode) {
      throw new Error("Missing component assembly fixture");
    }

    const markup = renderNodeCardMarkup(componentNode, "COMPONENT_ASSEMBLY");

    expect(markup).toContain('<button class="secondary-button compact-action" type="button">Confirm</button>');
  });

  it("summarizes grouped parts without rendering every raw STEP instance and exposes ambiguous matches", () => {
    const markup = renderHierarchyMarkup("parts");

    expect(markup).toContain("Parts");
    expect(markup).toContain("612 raw instances");
    expect(markup).toContain("18 grouped parts");
    expect(markup).toContain("4 ambiguous");
    expect(markup).not.toContain("part 600");
    expect(markup).not.toContain("SUB - Intake");
    expect(markup).not.toContain("COMP - Gearbox");
    expect(markup).toContain("Ambiguous matches");
    expect(markup).toContain("Wheel tread");
    expect(markup).toContain("WHD-001 - Wheel tread");
  });

  it("keeps the flat mapping table behind the advanced debug toggle", () => {
    const markup = renderHierarchyMarkup();

    expect(markup).toContain("Advanced flat view");
    expect(markup).not.toContain("<table");
    expect(markup).not.toContain("Detected items");
  });

  it("shows final review unresolved issues", () => {
    const markup = renderHierarchyMarkup("final");

    expect(markup).toContain("Final review");
    expect(markup).toContain("Unresolved issues");
    expect(markup).toContain("One part still needs review.");
    expect(markup).toContain("Wheel tread");
  });

  it("posts hierarchy part match decisions to the hierarchy review apply endpoint", async () => {
    const decision: CadHierarchyReviewDecision = {
      nodeId: "part-wheel",
      sourceKind: "PART_INSTANCE",
      targetKind: "PART_DEFINITION",
      targetId: "part-wheel",
      status: "CONFIRMED",
    };
    requestApiMock.mockResolvedValueOnce({ applied: [decision] });

    await applyCadHierarchyReview("snapshot-hierarchy", { decisions: [decision] });

    expect(requestApiMock).toHaveBeenCalledWith(
      "/cad/snapshots/snapshot-hierarchy/hierarchy-review/apply",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: [decision] }),
      },
      undefined,
    );
  });
});
