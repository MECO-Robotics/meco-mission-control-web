/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCadSnapshotDiffViewModel, CadSnapshotDiffPanel } from "../components/CadSnapshotDiffPanel";
import type { OnshapeOverview } from "../model/cadIntegrationTypes";

function createOverview(overrides: Partial<OnshapeOverview> = {}): OnshapeOverview {
  return {
    connection: {
      authMode: "oauth",
      baseUrl: "https://cad.onshape.com",
      configured: true,
      credentialReference: "onshape-oauth",
      lastError: null,
    },
    documentRefs: [],
    importRuns: [],
    syncJobs: [],
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
    ...overrides,
  };
}

describe("CadSnapshotDiffPanel", () => {
  it("uses future platform diff records to group statuses and warning badges by subsystem, mechanism, and part", () => {
    const overview = createOverview({
      snapshotDiffRecords: [
        {
          id: "diff-new-wheel",
          status: "new",
          sourceKind: "part_instance",
          sourceId: "wheel-instance-2",
          name: "Wheel tread",
          subsystemName: "Drive",
          mechanismName: "Swerve module",
          partName: "Wheel tread",
          detail: "Added second tread instance",
          warningIds: ["warning-wheel"],
        },
        {
          id: "diff-changed-plate",
          status: "changed",
          sourceKind: "part_definition",
          sourceId: "plate-current",
          previousSourceId: "plate-previous",
          name: "Module plate",
          subsystemName: "Drive",
          mechanismName: "Swerve module",
          partName: "Module plate",
          detail: "Material changed",
          changedFields: ["material"],
        },
        {
          id: "diff-removed-spacer",
          status: "removed",
          sourceKind: "part_definition",
          previousSourceId: "spacer-previous",
          name: "Old spacer",
          subsystemName: "Drive",
          mechanismName: "Swerve module",
          partName: "Old spacer",
        },
        {
          id: "diff-unchanged-pinion",
          status: "unchanged",
          sourceKind: "part_definition",
          sourceId: "pinion-current",
          previousSourceId: "pinion-previous",
          name: "Pinion",
          subsystemName: "Drive",
          mechanismName: "Gearbox",
          partName: "Pinion",
        },
      ],
      warnings: [{
        id: "warning-wheel",
        importRunId: "run-current",
        snapshotId: "snapshot-current",
        severity: "warning",
        code: "cad_part_quantity",
        title: "Quantity changed",
        message: "Wheel tread quantity changed.",
        createdAt: "2026-06-01T12:00:00.000Z",
      }],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);

    expect(viewModel.counts).toEqual({ new: 1, changed: 1, removed: 1, unchanged: 1 });
    expect(viewModel.groups[0].label).toBe("Drive");
    expect(viewModel.groups[0].mechanisms.map((mechanism) => mechanism.label)).toEqual(["Gearbox", "Swerve module"]);
    expect(viewModel.groups[0].warnings.map((warning) => warning.title)).toEqual(["Quantity changed"]);

    const markup = renderToStaticMarkup(React.createElement(CadSnapshotDiffPanel, { overview }));
    expect(markup).toContain("Onshape change preview");
    expect(markup).toContain("Preview only");
    expect(markup).toContain("Drive");
    expect(markup).toContain("Swerve module");
    expect(markup).toContain("Wheel tread");
    expect(markup).toContain("Quantity changed");
    expect(markup).not.toContain("Finalize");
  });

  it("falls back to overview snapshots when platform diff records are not available", () => {
    const previousSnapshot = {
      id: "snapshot-previous",
      label: "May 2026 release",
      onshapeDocumentRefId: "ref-1",
      importRunId: "run-previous",
      source: "onshape",
      documentId: "doc-1",
      workspaceId: null,
      versionId: "version-1",
      microversionId: null,
      elementId: "element-1",
      immutable: true,
      createdAt: "2026-05-01T12:00:00.000Z",
      previousSnapshotId: null,
    };
    const currentSnapshot = {
      ...previousSnapshot,
      id: "snapshot-current",
      label: "June 2026 release",
      importRunId: "run-current",
      versionId: "version-2",
      createdAt: "2026-06-01T12:00:00.000Z",
      previousSnapshotId: "snapshot-previous",
    };
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "gear-previous",
          snapshotId: "snapshot-previous",
          name: "Gear plate",
          partNumber: "G-100",
          material: "6061",
          configuration: "left",
          missionControlExternalKey: "part:gear-plate",
        },
        {
          id: "gear-current",
          snapshotId: "snapshot-current",
          name: "Gear plate",
          partNumber: "G-100",
          material: "7075",
          configuration: "left",
          missionControlExternalKey: "part:gear-plate",
        },
        {
          id: "bearing-current",
          snapshotId: "snapshot-current",
          name: "Bearing block",
          partNumber: "B-200",
          material: "steel",
          configuration: null,
          missionControlExternalKey: "part:bearing-block",
        },
        {
          id: "old-spacer-previous",
          snapshotId: "snapshot-previous",
          name: "Old spacer",
          partNumber: "S-001",
          material: "nylon",
          configuration: null,
          missionControlExternalKey: "part:old-spacer",
        },
        {
          id: "pinion-previous",
          snapshotId: "snapshot-previous",
          name: "Pinion",
          partNumber: "P-090",
          material: "steel",
          configuration: null,
          missionControlExternalKey: "part:pinion",
        },
        {
          id: "pinion-current",
          snapshotId: "snapshot-current",
          name: "Pinion",
          partNumber: "P-090",
          material: "steel",
          configuration: null,
          missionControlExternalKey: "part:pinion",
        },
      ],
      warnings: [{
        id: "warning-gear",
        importRunId: "run-current",
        snapshotId: "snapshot-current",
        severity: "warning",
        code: "cad_material_changed",
        title: "Material changed",
        message: "Gear plate material changed from 6061 to 7075.",
        createdAt: "2026-06-01T12:00:00.000Z",
      }],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);

    expect(viewModel.currentSnapshot?.id).toBe("snapshot-current");
    expect(viewModel.previousSnapshot?.id).toBe("snapshot-previous");
    expect(viewModel.counts).toEqual({ new: 1, changed: 1, removed: 1, unchanged: 1 });
    expect(viewModel.groups[0].label).toBe("Unassigned subsystem");
    expect(viewModel.groups[0].warnings.map((warning) => warning.title)).toEqual(["Material changed"]);

    const markup = renderToStaticMarkup(React.createElement(CadSnapshotDiffPanel, { overview }));
    expect(markup).toContain("Comparing June 2026 release against May 2026 release.");
    expect(markup).toContain("Gear plate");
    expect(markup).toContain("Changed: material");
    expect(markup).toContain("Bearing block");
    expect(markup).toContain("Old spacer");
    expect(markup).toContain("Pinion");
    expect(markup).toContain("Material changed");
  });
});
