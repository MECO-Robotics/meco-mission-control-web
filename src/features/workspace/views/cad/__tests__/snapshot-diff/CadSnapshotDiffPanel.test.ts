/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadSnapshotDiffPanel } from "../../components/CadSnapshotDiffPanel";
import { buildCadSnapshotDiffViewModel } from "../../model/cadSnapshotDiffViewModel";
import { createOverview, createSnapshotPair } from "./cadSnapshotDiffTestUtils";

describe("CadSnapshotDiffPanel", () => {
  it("does not show Onshape source metadata before a snapshot exists", () => {
    const markup = renderToStaticMarkup(React.createElement(CadSnapshotDiffPanel, { overview: createOverview({ snapshots: [] }) }));

    expect(markup).toContain("Run BOM Sync to create a CAD snapshot before previewing changes.");
    expect(markup).toContain("Not started");
    expect(markup).not.toContain("Source: Onshape sync.");
    expect(markup).not.toContain("Preview only");
    expect(markup).not.toContain("Review-only data that has not been finalized into Robot Configuration.");
  });

  it("uses future platform diff records to group statuses and warning badges by subsystem, mechanism, and part", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      latestSnapshot: currentSnapshot,
      snapshots: [previousSnapshot, currentSnapshot],
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
    expect(markup).toContain("Source: Onshape sync.");
    expect(markup).toContain("Review-only data that has not been finalized into Robot Configuration.");
    expect(markup).toContain("Drive");
    expect(markup).toContain("Swerve module");
    expect(markup).toContain("Wheel tread");
    expect(markup).toContain("Quantity changed");
    expect(markup).not.toContain("Finalize");
  });
});
