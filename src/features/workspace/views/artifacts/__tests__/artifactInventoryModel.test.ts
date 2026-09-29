import type { ArtifactRecord } from "@/types/recordsInventory";
import { getUpdatedDateKey, sortArtifacts } from "../artifactInventoryModel";

function artifact(id: string, workstreamId: string | null): ArtifactRecord {
  return {
    id,
    projectId: "project-1",
    workstreamId,
    kind: "document",
    title: id,
    summary: "",
    status: "draft",
    link: "",
    updatedAt: "2026-04-25T12:00:00.000Z",
  };
}

describe("artifact inventory model", () => {
  it("sorts workflows by the name displayed in the table", () => {
    const artifacts = [artifact("alpha-id", "workstream-z"), artifact("zeta-id", "workstream-a"), artifact("project", null)];
    const workstreamsById = { "workstream-z": "Alpha", "workstream-a": "Zulu" };

    expect(sortArtifacts(artifacts, "workstream", "ascending", workstreamsById).map((item) => item.id)).toEqual([
      "alpha-id",
      "project",
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
