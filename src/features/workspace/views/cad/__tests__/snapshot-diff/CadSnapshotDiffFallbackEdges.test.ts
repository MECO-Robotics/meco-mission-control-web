/// <reference types="jest" />

import { buildCadSnapshotDiffViewModel } from "../../model/cadSnapshotDiffViewModel";
import { createOverview, createSnapshotPair } from "./cadSnapshotDiffTestUtils";

function fallbackStatuses(overview: ReturnType<typeof createOverview>) {
  const viewModel = buildCadSnapshotDiffViewModel(overview);
  return viewModel.groups.flatMap((group) => (
    group.mechanisms.flatMap((mechanism) => mechanism.parts.flatMap((part) => part.items.map((item) => item.status)))
  ));
}

describe("CadSnapshotDiffPanel fallback edge cases", () => {
  it("does not compare fallback snapshots across Onshape document refs", () => {
    const currentSnapshot = {
      id: "snapshot-current",
      label: "June 2026 release",
      onshapeDocumentRefId: "ref-current",
      importRunId: "run-current",
      source: "onshape",
      documentId: "doc-current",
      workspaceId: null,
      versionId: "version-current",
      microversionId: null,
      elementId: "element-current",
      immutable: true,
      createdAt: "2026-06-01T12:00:00.000Z",
      previousSnapshotId: null,
    };
    const olderOtherDocumentSnapshot = {
      ...currentSnapshot,
      id: "snapshot-other-document",
      label: "Other document release",
      onshapeDocumentRefId: "ref-other",
      importRunId: "run-other",
      documentId: "doc-other",
      versionId: "version-other",
      createdAt: "2026-05-01T12:00:00.000Z",
    };
    const overview = createOverview({
      snapshots: [currentSnapshot, olderOtherDocumentSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "current-plate",
          snapshotId: currentSnapshot.id,
          name: "New document plate",
          partNumber: "PN-700",
          material: "Steel",
          configuration: "default",
          missionControlExternalKey: "plate",
        },
        {
          id: "other-plate",
          snapshotId: olderOtherDocumentSnapshot.id,
          name: "Other document plate",
          partNumber: "PN-700",
          material: "Aluminum",
          configuration: "default",
          missionControlExternalKey: "plate",
        },
      ],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);

    expect(viewModel.previousSnapshot).toBeNull();
    expect(viewModel.counts).toEqual({ new: 1, changed: 0, removed: 0, unchanged: 0 });
    expect(viewModel.groups[0].mechanisms[0].parts[0].items[0].label).toBe("New document plate");
  });

  it("does not mark stable part instances changed because snapshot row ids changed", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      partDefinitions: [
        {
          id: "wheel-previous",
          snapshotId: previousSnapshot.id,
          name: "Wheel",
          partNumber: "PN-800",
          material: "Rubber",
          configuration: "default",
          missionControlExternalKey: "wheel",
        },
        {
          id: "wheel-current",
          snapshotId: currentSnapshot.id,
          name: "Wheel",
          partNumber: "PN-800",
          material: "Rubber",
          configuration: "default",
          missionControlExternalKey: "wheel",
        },
      ],
      partInstances: [
        {
          id: "wheel-instance-previous",
          snapshotId: previousSnapshot.id,
          cadPartDefinitionId: "wheel-previous",
          parentAssemblyNodeId: "assembly-previous",
          partId: "part-wheel",
          instancePath: "/robot/module/wheel",
          quantity: 1,
          suppressed: false,
          configuration: "default",
        },
        {
          id: "wheel-instance-current",
          snapshotId: currentSnapshot.id,
          cadPartDefinitionId: "wheel-current",
          parentAssemblyNodeId: "assembly-current",
          partId: "part-wheel",
          instancePath: "/robot/module/wheel",
          quantity: 1,
          suppressed: false,
          configuration: "default",
        },
      ],
    });

    expect(buildCadSnapshotDiffViewModel(overview).counts).toEqual({ new: 0, changed: 0, removed: 0, unchanged: 2 });
    expect(fallbackStatuses(overview).sort()).toEqual(["unchanged", "unchanged"]);
  });

  it("does not mark stable assembly nodes changed because parent snapshot row ids changed", () => {
    const { currentSnapshot, previousSnapshot } = createSnapshotPair();
    const overview = createOverview({
      snapshots: [currentSnapshot, previousSnapshot],
      latestSnapshot: currentSnapshot,
      assemblyNodes: [
        {
          id: "gearbox-previous",
          snapshotId: previousSnapshot.id,
          parentAssemblyNodeId: "parent-previous",
          instancePath: "/robot/gearbox",
          name: "Nested gearbox",
          inferredType: "mechanism",
          subsystemId: "drive",
          mechanismId: "swerve",
        },
        {
          id: "gearbox-current",
          snapshotId: currentSnapshot.id,
          parentAssemblyNodeId: "parent-current",
          instancePath: "/robot/gearbox",
          name: "Nested gearbox",
          inferredType: "mechanism",
          subsystemId: "drive",
          mechanismId: "swerve",
        },
      ],
    });

    const viewModel = buildCadSnapshotDiffViewModel(overview);
    const item = viewModel.groups[0].mechanisms[0].parts[0].items[0];

    expect(viewModel.counts).toEqual({ new: 0, changed: 0, removed: 0, unchanged: 1 });
    expect(item.status).toBe("unchanged");
    expect(item.changedFields).toEqual([]);
  });
});
