import { buildMentorApprovedQaRiskReassessmentPatch } from "../qaRiskReassessment";
import type { QaReportPayload } from "@/types/payloads";
import type { RiskRecord } from "@/types/recordsReporting";

const risk: RiskRecord = {
  id: "risk-1",
  title: "Drive base clearance",
  detail: "Frame rail may interfere after iteration.",
  severity: "high",
  status: "open",
  sourceType: "qa-report",
  sourceId: "report-1",
  attachmentType: "project",
  attachmentId: "project-1",
  mitigationTaskId: "task-1",
};

function createReport(overrides: Partial<QaReportPayload>): QaReportPayload {
  return {
    reportType: "QA",
    projectId: "project-1",
    taskId: "task-1",
    milestoneId: null,
    workstreamId: null,
    createdByMemberId: "mentor-1",
    result: "pass",
    summary: "",
    notes: "",
    photoUrl: "",
    createdAt: "2026-06-03",
    mentorApproved: false,
    proposedRiskId: "risk-1",
    proposedRiskSeverity: "medium",
    proposedRiskStatus: "partially-mitigated",
    ...overrides,
  };
}

describe("buildMentorApprovedQaRiskReassessmentPatch", () => {
  it("does not change risk state without mentor approval", () => {
    expect(buildMentorApprovedQaRiskReassessmentPatch(createReport({}), risk)).toEqual({});
  });

  it("builds a severity and status patch after mentor approval", () => {
    expect(
      buildMentorApprovedQaRiskReassessmentPatch(
        createReport({ mentorApproved: true }),
        risk,
      ),
    ).toEqual({
      severity: "medium",
      status: "partially-mitigated",
    });
  });

  it("omits reassessment fields that do not change the risk", () => {
    expect(
      buildMentorApprovedQaRiskReassessmentPatch(
        createReport({
          mentorApproved: true,
          proposedRiskSeverity: "high",
          proposedRiskStatus: "open",
        }),
        risk,
      ),
    ).toEqual({});
  });
});
