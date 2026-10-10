import type { ArtifactRecord } from "@/types/recordsInventory";
import { getUpdatedDateKey, sortArtifacts } from "../artifactInventoryModel";

function artifact(id: string, targetId: string): ArtifactRecord {
  return {
    id,
    projectId: "project-1",
    targetRefs: [{ kind: "task", id: targetId }],
    kind: "document",
    title: id,
    summary: "",
    status: "draft",
    uri: "",
    updatedAt: "2026-04-25T12:00:00.000Z",
  };
}

describe("artifact inventory model", () => {
  it("sorts documents by their typed domain targets", () => {
    const artifacts = [artifact("zeta-id", "task-z"), artifact("alpha-id", "task-a")];

    expect(sortArtifacts(artifacts, "targets", "ascending").map((item) => item.id)).toEqual([
      "alpha-id",
      "zeta-id",
    ]);
  });

  it("uses a calendar-day key for artifact update dates", () => {
    expect(getUpdatedDateKey("2026-04-25T10:00:00")).toBe(
      getUpdatedDateKey("2026-04-25T15:00:00"),
    );
    expect(getUpdatedDateKey("not-a-date")).toBe("");
  });
});
