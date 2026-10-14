/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import { buildHomeViewModel } from "@/features/workspace/views/overview/overviewViewModel";
import { summarizeUri } from "@/features/workspace/views/artifacts/artifactInventoryModel";
import type { BootstrapPayload } from "@/types/bootstrap";
import type {
  MeetingRecord,
  MilestoneRequirementRecord,
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
        targetRefs: [{ kind: "project", id: "project-1" }],
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
          seasonId: "season-1",
          title: "Milestone 1",
          type: "internal-review",
          status: "planned",
          readinessStatus: "blocked",
          startAt: "2026-01-10T12:00:00",
          endAt: null,
          description: "",
          projectIds: ["project-1"],
        },
      ],
      milestoneRequirements,
    };

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.milestoneRequirements).toEqual(milestoneRequirements);
    expect(normalized.milestones[0]?.readinessStatus).toBe("blocked");
  });

  it("preserves canonical schedule times and artifact URIs", () => {
    const payload = structuredClone(EMPTY_BOOTSTRAP);
    payload.milestones = [{
      id: "milestone-1",
      seasonId: "season-1",
      title: "Robot checkpoint",
      type: "practice",
      status: "planned",
      readinessStatus: "blocked",
      startAt: "2026-09-28T00:00:00.000Z",
      endAt: null,
      description: "",
      projectIds: [],
    }];
    payload.artifacts = [{
      id: "document-1",
      projectId: "project-1",
      targetRefs: [{ kind: "project", id: "project-1" }],
      kind: "document",
      title: "Build notes",
      summary: "Robot build notes",
      status: "published",
      uri: "https://example.org/build-notes",
      updatedAt: "2026-09-30T00:00:00.000Z",
    }];

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.milestones[0]).toMatchObject({ startAt: "2026-09-28T00:00:00.000Z", endAt: null });
    expect(buildHomeViewModel({ bootstrap: normalized, today: new Date("2026-09-27T12:00:00") }).upcomingMilestones).toMatchObject([
      { id: "milestone-1", title: "Robot checkpoint" },
    ]);
    expect(normalized.artifacts[0]?.uri).toBe("https://example.org/build-notes");
    expect(summarizeUri(normalized.artifacts[0]!.uri)).toBe("example.org/build-notes");
  });

  it("preserves calendar bootstrap records", () => {
    const meetings: MeetingRecord[] = [
      {
        id: "meeting-1",
        title: "Build Standup",
        meetingType: "build",
        seasonId: "season-1",
        projectIds: [],
        startAt: "2026-03-01T17:30",
        endAt: null,
        location: "",
        description: "",
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
    };

    const normalized = normalizeBootstrapPayload(payload);

    expect(normalized.meetings).toEqual(meetings);
    expect(normalized.attendanceRecords).toEqual(payload.attendanceRecords);
  });

  it("preserves QA requests required by the platform bootstrap contract", () => {
    const qaRequests: QaRequestRecord[] = [
      {
        id: "qa-request-1",
        projectId: "project-1",
        targetRefs: [{ kind: "task", id: "task-1" }],
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

  it("preserves canonical risk targets without storing duplicate task blocker fields", () => {
    const source = createBootstrap();
    const risk = {
      id: "risk-1",
      projectId: source.projects[0].id,
      title: "Drive train interference",
      detail: "The chain may contact the frame.",
      category: "design" as const,
      severity: "medium" as const,
      status: "open" as const,
      blocksWork: true,
      source: { kind: "manual" as const },
      relatedTargets: [{ kind: "task" as const, id: source.tasks[0].id }],
      mitigationTaskId: null,
      ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      resolvedAt: null,
    };
    source.risks = [risk];

    const normalized = normalizeBootstrapPayload(source);

    expect(normalized.risks).toEqual([risk]);
    expect(normalized.tasks[0]).not.toHaveProperty("blockers");
    expect(normalized.tasks[0]).not.toHaveProperty("targetRiskId");
  });
});

it("preserves canonical report and evidence collections", () => {
  const source = createBootstrap();
  const normalized = normalizeBootstrapPayload(source);
  expect(normalized.reports).toEqual(source.reports);
  expect(normalized.qaFindings).toEqual(source.qaFindings);
  expect(normalized.testResults).toEqual(source.testResults);
  expect(normalized.testFindings).toEqual(source.testFindings);
});

it("preserves canonical project and target identities without bucket merging or name inference", () => {
  const source = createBootstrap();
  source.projects = [
    { ...source.projects[0], id: "project-a", name: "Robot", projectType: "robot" },
    { ...source.projects[0], id: "project-b", name: "Outreach", projectType: "outreach" },
  ];
  source.workstreams = [{ id: "workstream-b", projectId: "project-b", name: source.subsystems[0].name, description: "" }];
  source.tasks[0] = {
  ...source.tasks[0], projectId: "project-a", workstreamIds: [], photoUrl: "data:image/png;base64,photo" };
  source.subsystems[0].projectId = "project-a";
  const normalized = normalizeBootstrapPayload(source);
  expect(normalized.projects).toEqual(source.projects);
  expect(normalized.seasons).toEqual(source.seasons);
  expect(normalized.workstreams.map(({ id, projectId, name }) => ({ id, projectId, name }))).toEqual([
    { id: "workstream-b", projectId: "project-b", name: source.subsystems[0].name },
  ]);
  expect(normalized.tasks[0]).toMatchObject({ projectId: "project-a", workstreamIds: [], photoUrl: source.tasks[0].photoUrl });
  expect(normalized.subsystems[0].projectId).toBe("project-a");
  expect(normalizeBootstrapPayload({ ...source, workstreams: [] }).workstreams).toEqual([]);
  expect(normalizeBootstrapPayload(normalized)).toEqual(normalized);
});
