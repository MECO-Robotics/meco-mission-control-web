/// <reference types="jest" />

import {
  baseHierarchyReview,
  renderHierarchyMarkup,
  renderNodeCardMarkup,
} from "./cadStepHierarchyReviewTestHelpers";

describe("CAD STEP hierarchy review stages", () => {
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

});
