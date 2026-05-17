/// <reference types="jest" />

import { applyCadHierarchyReview } from "../api/cadStepApi";
import type { CadHierarchyReviewDecision } from "../model/cadIntegrationTypes";

const requestApiMock = jest.fn();

jest.mock("@/lib/auth/core/request", () => ({
  requestApi: (...args: unknown[]) => requestApiMock(...args),
}));

describe("CAD STEP hierarchy review API", () => {
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
