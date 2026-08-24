/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import type { BootstrapPayload } from "@/types/bootstrap";
import type {
  EscalationRecord,
  MeetingRecord,
  MilestoneRequirementRecord,
  QaReviewRecord,
  QaRequestRecord,
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
          status: "blocked",
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
    expect(normalized.milestones[0]?.status).toBe("blocked");
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

    expect(normalized.meetings).toEqual([
      {
        ...meetings[0],
        meetingType: "general",
        projectIds: [],
        startDateTime: "2026-03-01T17:30",
        endDateTime: null,
        location: "",
        description: "",
      },
    ]);
    expect(normalized.attendanceRecords).toEqual(payload.attendanceRecords);
    expect(normalized.qaReviews).toEqual(qaReviews);
    expect(normalized.escalations).toEqual(escalations);
  });

  it("preserves QA requests required by the platform bootstrap contract", () => {
    const qaRequests: QaRequestRecord[] = [
      {
        id: "qa-request-1",
        taskId: "task-1",
        subject: "Review drivetrain wiring",
        mentorId: "mentor-1",
        requestedById: "student-1",
        createdAt: "2026-03-01T20:00:00.000Z",
        status: "requested",
      },
    ];
    const payload: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      qaRequests,
    };

    expect(normalizeBootstrapPayload(payload).qaRequests).toEqual(qaRequests);
  });

  it("normalizes unknown task blocker types to other", () => {
    const payload = {
      ...EMPTY_BOOTSTRAP,
      taskBlockers: [
        {
          id: "task-blocker-1",
          blockedTaskId: "task-1",
          blockerType: "vendor-shutdown",
          blockerId: null,
          description: "Unexpected vendor blocker",
          severity: "medium",
          status: "open",
          createdByMemberId: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          resolvedAt: null,
        },
      ],
    } as unknown as BootstrapPayload;

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.taskBlockers?.[0]?.blockerType).toBe("other");
    expect(normalized.taskBlockers?.[0]?.sourceKind).toBe("vendor-shutdown");
  });

  it("retains the legacy external relationship kind and source id", () => {
    const payload = {
      ...EMPTY_BOOTSTRAP,
      taskBlockers: [{
        id: "external-blocker",
        blockedTaskId: "task-1",
        blockerType: "external",
        blockerId: "vendor-order-42",
      }],
    } as unknown as BootstrapPayload;

    const blocker = normalizeBootstrapPayload(payload).taskBlockers?.[0];
    expect(blocker?.blockerType).toBe("other");
    expect(blocker?.blockerId).toBe("vendor-order-42");
    expect(blocker?.sourceKind).toBe("external");
  });

  it("preserves task target risk through bootstrap normalization", () => {
    const payload = {
      ...EMPTY_BOOTSTRAP,
      tasks: [
        {
          id: "task-1",
          title: "Mitigate drivetrain risk",
          targetRiskId: "risk-1",
        },
      ],
    } as unknown as BootstrapPayload;

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.tasks[0]?.targetRiskId).toBe("risk-1");
  });
});
