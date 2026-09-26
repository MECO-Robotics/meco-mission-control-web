/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
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
  it("keeps empty bootstrap empty and independent of the current date", () => {
    const first = normalizeBootstrapPayload(EMPTY_BOOTSTRAP);
    jest.useFakeTimers().setSystemTime(new Date("2035-12-25"));
    try {
      expect(normalizeBootstrapPayload(EMPTY_BOOTSTRAP)).toEqual(first);
      expect(Object.values(first).every((records) => records.length === 0)).toBe(true);
    } finally {
      jest.useRealTimers();
    }
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
    expect(normalized.taskBlockers?.[0]?.sourceKind).toBe("external");
  });

  it("decodes issue category separately from the source relationship", () => {
    const payload = { ...EMPTY_BOOTSTRAP, taskBlockers: [{
      id: "blocker-1", blockedTaskId: "task-1", blockerType: "external",
      issueType: "shipping-delay", blockerId: "vendor-order-42",
    }] } as unknown as BootstrapPayload;
    const blocker = normalizeBootstrapPayload(payload).taskBlockers?.[0];
    expect(blocker?.blockerType).toBe("shipping-delay");
    expect(blocker?.sourceKind).toBe("external");
    expect(blocker?.blockerId).toBe("vendor-order-42");
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
    expect(blocker?.blockerType).toBe("external");
    expect(blocker?.blockerId).toBe("vendor-order-42");
    expect(blocker?.sourceKind).toBe("external");
  });

  it("derives task target risk from the authoritative risk relation", () => {
    const payload = {
      ...EMPTY_BOOTSTRAP,
      risks: [{ id: "risk-1", mitigationTaskId: "task-1" }],
      tasks: [
        {
          id: "task-1",
          title: "Mitigate drivetrain risk",
        },
      ],
    } as unknown as BootstrapPayload;

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.tasks[0]?.targetRiskId).toBe("risk-1");
  });
});

it("keeps empty canonical report collections authoritative over stale legacy copies", () => {
  const input = {
    ...EMPTY_BOOTSTRAP,
    qaReports: [{ id: "retired-qa" }],
    testResults: [{ id: "retired-test" }],
    qaFindings: [{ id: "retired-finding" }],
    testFindings: [{ id: "retired-test-finding" }],
  };
  const normalized = normalizeBootstrapPayload(input);
  expect(normalized.reports).toEqual([]);
  expect(normalized.reportFindings).toEqual([]);
  for (const field of ["qaReports", "testResults", "qaFindings", "testFindings"]) {
    expect(normalized).not.toHaveProperty(field);
  }
});

it("preserves canonical project and target identities without bucket merging or name inference", () => {
  const source = createBootstrap();
  source.projects = [
    { ...source.projects[0], id: "project-a", name: "Custom outreach A", projectType: "outreach" },
    { ...source.projects[0], id: "project-b", name: "Custom outreach B", projectType: "outreach" },
  ];
  source.workstreams = [{ id: "workstream-b", projectId: "project-b", name: source.subsystems[0].name, description: "" }];
  source.tasks[0] = { ...source.tasks[0], projectId: "project-a", workstreamId: null, workstreamIds: [], photoUrl: "data:image/png;base64,photo" };
  source.subsystems[0].projectId = "project-a";
  const normalized = normalizeBootstrapPayload(source);
  expect(normalized.projects).toEqual(source.projects);
  expect(normalized.seasons).toEqual(source.seasons);
  expect(normalized.workstreams.map(({ id, projectId, name }) => ({ id, projectId, name }))).toEqual([
    { id: "workstream-b", projectId: "project-b", name: source.subsystems[0].name },
  ]);
  expect(normalized.tasks[0]).toMatchObject({ projectId: "project-a", workstreamId: null, workstreamIds: [], photoUrl: source.tasks[0].photoUrl });
  expect(normalized.subsystems[0].projectId).toBe("project-a");
  expect(normalizeBootstrapPayload({ ...source, workstreams: [] }).workstreams).toEqual([]);
  expect(normalizeBootstrapPayload(normalized)).toEqual(normalized);
});
