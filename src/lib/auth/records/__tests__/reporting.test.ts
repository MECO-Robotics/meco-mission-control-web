import { createQaReportRecord, retestReportFindingRecord } from "../reporting";
import { requestItem } from "../common";

jest.mock("../common", () => ({ requestItem: jest.fn() }));

const requestItemMock = jest.mocked(requestItem);

beforeEach(() => requestItemMock.mockReset());

it("submits QA evidence through the review-owned route without client approval fields", async () => {
  requestItemMock.mockResolvedValueOnce({ id: "qa-report" } as never);
  const payload = {
    reportType: "qa" as const,
    projectId: "project-1",
    targetRefs: [{ kind: "task" as const, id: "task-1" }],
    createdByMemberId: "student-1",
    participantIds: ["student-1"],
    mentorId: null,
    requestedById: null,
    result: "pass" as const,
    summary: "",
    notes: "Checked fit",
    createdAt: "2026-10-15T12:00:00.000Z",
    status: "reviewed" as const,
  };

  await createQaReportRecord(payload, jest.fn());

  expect(requestItemMock).toHaveBeenCalledWith("/qa-reports/submit", "POST", payload, expect.any(Function));
  expect(payload).toHaveProperty("status", "reviewed");
  expect(payload).not.toHaveProperty("reviewedById");
  expect(payload).not.toHaveProperty("reviewedAt");
});

it("sends the stable retest operation and finding category to the lifecycle route", async () => {
  requestItemMock.mockResolvedValueOnce({ id: "finding-1" } as never);
  const payload = { operationId: "stable-retest-1", sourceType: "qa" as const, result: "pass" as const, notes: "Retightened and checked", evidenceNotes: "Witness mark is aligned", observedAt: "2026-10-15T12:00:00.000Z" };

  await retestReportFindingRecord("finding-1", payload);

  expect(requestItemMock).toHaveBeenCalledWith("/report-findings/finding-1/retest", "POST", payload, undefined);
});
