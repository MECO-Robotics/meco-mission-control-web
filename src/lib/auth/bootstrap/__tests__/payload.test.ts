/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import type { BootstrapPayload } from "@/types/bootstrap";
import type {
  EscalationRecord,
  MeetingRecord,
  MilestoneRequirementRecord,
  QaReviewRecord,
} from "@/types/recordsExecution";

describe("normalizeBootstrapPayload", () => {
  it("creates separate Operations and Business projects by default", () => {
    const normalized = normalizeBootstrapPayload(EMPTY_BOOTSTRAP);
    const operationsProject = normalized.projects.find((project) => project.name === "Operations");
    const businessProject = normalized.projects.find((project) => project.name === "Business");

    expect(operationsProject).toBeDefined();
    expect(businessProject).toBeDefined();
    expect(operationsProject?.id).not.toBe(businessProject?.id);
  });

  it("preserves milestone requirements", () => {
    const milestoneId = "milestone-1";
    const milestoneRequirements: MilestoneRequirementRecord[] = [
      {
        id: "milestone-requirement-1",
        milestoneId,
        targetType: "project",
        targetId: "project-1",
        conditionType: "custom",
        conditionValue: "in_scope",
        required: true,
        sortOrder: 0,
        notes: "Must be in scope",
      },
    ];

    const payload: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      milestones: [
        {
          id: milestoneId,
          title: "Milestone 1",
          type: "internal-review",
          startDateTime: "2026-01-10T12:00:00",
          endDateTime: null,
          isExternal: false,
          description: "",
          projectIds: ["project-1"],
        },
      ],
      milestoneRequirements,
    };

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.milestoneRequirements).toEqual(milestoneRequirements);
  });

  it("preserves calendar and triage bootstrap records", () => {
    const meetings: MeetingRecord[] = [
      {
        id: "meeting-1",
        title: "Build Standup",
        date: "2026-03-01",
        time: "17:30",
        rsvpsYes: 5,
        rsvpsMaybe: 2,
        openSignIns: 1,
      },
    ];
    const qaReviews: QaReviewRecord[] = [
      {
        id: "qa-review-1",
        subjectId: "task-1",
        subjectType: "task",
        subjectTitle: "Wire drive train",
        participantIds: ["member-1"],
        result: "pass",
        mentorApproved: true,
        notes: "Ready for next step",
        reviewedAt: "2026-03-01T20:00:00.000Z",
      },
    ];
    const escalations: EscalationRecord[] = [
      {
        title: "Battery shipment delayed",
        detail: "Critical battery order is delayed by 3 days.",
        severity: "high",
      },
    ];
    const payload: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      meetings,
      attendanceRecords: [
        {
          id: "attendance-1",
          memberId: "member-1",
          date: "2026-03-01",
          totalHours: 3,
        },
      ],
      qaReviews,
      escalations,
    };

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.meetings).toEqual(meetings);
    expect(normalized.attendanceRecords).toEqual(payload.attendanceRecords);
    expect(normalized.qaReviews).toEqual(qaReviews);
    expect(normalized.escalations).toEqual(escalations);
  });
});
