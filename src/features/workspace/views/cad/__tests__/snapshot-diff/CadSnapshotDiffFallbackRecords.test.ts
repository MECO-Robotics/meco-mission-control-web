/// <reference types="jest" />

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CadSnapshotDiffPanel } from "../../components/CadSnapshotDiffPanel";
import { buildCadSnapshotDiffViewModel } from "../../model/cadSnapshotDiffViewModel";
import { createOverview, createSnapshotPair } from "./cadSnapshotDiffTestUtils";

describe("CadSnapshotDiffPanel fallback records", () => {
  it("falls back to overview snapshots when platform diff records are not available", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "gear-previous",
          snapshotId: previousSnapshot.id,
          name: "Drive gear",
          partNumber: "PN-101",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: "gear",
        },
        {
          id: "gear-current",
          snapshotId: currentSnapshot.id,
          name: "Drive gear",
          partNumber: "PN-101",
          material: "Aluminum",
          configuration: "default",
          missionControlExternalKey: "gear",
        },
        {
          id: "bearing-current",
          snapshotId: currentSnapshot.id,
          name: "Support bearing",
          partNumber: "PN-202",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: "bearing",
        },
        {
          id: "spacer-previous",
          snapshotId: previousSnapshot.id,
          name: "Old spacer",
          partNumber: "PN-303",
          material: "Nylon",
          configuration: "default",
          missionControlExternalKey: "spacer",
        },
        {
          id: "pinion-previous",
          snapshotId: previousSnapshot.id,
          name: "Pinion",
          partNumber: "PN-404",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: "pinion",
        },
        {
          id: "pinion-current",
          snapshotId: currentSnapshot.id,
          name: "Pinion",
          partNumber: "PN-404",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: "pinion",
        },
      ],
      warnings: [{
        id: "warning-gear",
        importRunId: currentSnapshot.importRunId,
        snapshotId: currentSnapshot.id,
        severity: "warning",
        code: "cad_material_gear",
        title: "Drive gear material changed",
        message: "Drive gear material changed.",
        createdAt: currentSnapshot.createdAt,
      }],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);

    expect(viewModel.currentSnapshot?.id).toBe(currentSnapshot.id);
    expect(viewModel.previousSnapshot?.id).toBe(previousSnapshot.id);
    expect(viewModel.counts).toEqual({ new: 1, changed: 1, removed: 1, unchanged: 1 });
    expect(viewModel.groups[0].label).toBe("Unassigned subsystem");
    expect(viewModel.groups[0].warnings.map((warning) => warning.title)).toEqual(["Drive gear material changed"]);

    const markup = renderToStaticMarkup(React.createElement(CadSnapshotDiffPanel, { overview }));
    expect(markup).toContain("Comparing June 2026 release against May 2026 release");
    expect(markup).toContain("Support bearing");
    expect(markup).toContain("Drive gear");
    expect(markup).toContain("Changed: material");
    expect(markup).toContain("Old spacer");
    expect(markup).toContain("Drive gear material changed");
  });

  it("keeps configured part definitions separate in fallback diff keys", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "plate-left-previous",
          snapshotId: previousSnapshot.id,
          name: "Mirror plate",
          partNumber: "PN-500",
          material: "Aluminum",
          configuration: "left",
          missionControlExternalKey: "mirror-plate",
        },
        {
          id: "plate-right-previous",
          snapshotId: previousSnapshot.id,
          name: "Mirror plate",
          partNumber: "PN-500",
          material: "Aluminum",
          configuration: "right",
          missionControlExternalKey: "mirror-plate",
        },
        {
          id: "plate-left-current",
          snapshotId: currentSnapshot.id,
          name: "Mirror plate",
          partNumber: "PN-500",
          material: "Aluminum",
          configuration: "left",
          missionControlExternalKey: "mirror-plate",
        },
      ],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);
    const statuses = viewModel.groups.flatMap((group) => (
      group.mechanisms.flatMap((mechanism) => mechanism.parts.flatMap((part) => part.items.map((item) => item.status)))
    ));

    expect(viewModel.counts).toEqual({ new: 0, changed: 0, removed: 1, unchanged: 1 });
    expect(statuses.sort()).toEqual(["removed", "unchanged"]);
  });

  it("treats part number updates as changed fields when no external key is available", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "climber-hook-previous",
          snapshotId: previousSnapshot.id,
          name: "Climber hook",
          partNumber: "PN-900",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: null,
        },
        {
          id: "climber-hook-current",
          snapshotId: currentSnapshot.id,
          name: "Climber hook",
          partNumber: "PN-901",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: null,
        },
      ],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);
    const item = viewModel.groups[0].mechanisms[0].parts[0].items[0];

    expect(viewModel.counts).toEqual({ new: 0, changed: 1, removed: 0, unchanged: 0 });
    expect(item.status).toBe("changed");
    expect(item.changedFields).toEqual(["partNumber"]);
  });

  it("treats part renames as changed fields when part number is stable", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "intake-plate-previous",
          snapshotId: previousSnapshot.id,
          name: "Intake plate",
          partNumber: "PN-902",
          material: "Aluminum",
          configuration: "default",
          missionControlExternalKey: null,
        },
        {
          id: "intake-side-plate-current",
          snapshotId: currentSnapshot.id,
          name: "Intake side plate",
          partNumber: "PN-902",
          material: "Aluminum",
          configuration: "default",
          missionControlExternalKey: null,
        },
      ],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);
    const item = viewModel.groups[0].mechanisms[0].parts[0].items[0];

    expect(viewModel.counts).toEqual({ new: 0, changed: 1, removed: 0, unchanged: 0 });
    expect(item.status).toBe("changed");
    expect(item.changedFields).toEqual(["name"]);
  });
});
