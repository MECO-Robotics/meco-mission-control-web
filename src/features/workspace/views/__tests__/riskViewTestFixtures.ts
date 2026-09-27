import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import type { BootstrapPayload } from "@/types/bootstrap";

const memberOne = {
  id: "member-1",
  name: "Alex Builder",
  email: "alex@example.com",
  role: "student" as const,
  elevated: false,
  seasonId: "season-1",
};

const memberTwo = {
  ...memberOne,
  id: "member-2",
  name: "Blair Fabricator",
  email: "blair@example.com",
};

const baseTask: BootstrapPayload["tasks"][number] = {
  artifactIds: [],
  id: "task-1",
  projectId: "project-1",
  workstreamIds: [],
  subsystemIds: ["subsystem-1"],
  disciplineId: "",
  mechanismIds: [],
  partInstanceIds: [],
  title: "Member one task",
  summary: "",
  targetMilestoneId: null,
  photoUrl: "",
  ownerId: "member-1",
  assigneeIds: [],
  mentorId: null,
  startDate: "2026-04-20",
  dueDate: "2026-04-22",
  priority: "medium",
  status: "not-started",

  blockers: [],
  linkedManufacturingIds: [],
  linkedPurchaseIds: [],
  estimatedHours: 1,
  actualHours: 0,
  requiresDocumentation: false,
  documentationLinked: false,
};

export function createBootstrap(): BootstrapPayload {
  return {
    ...EMPTY_BOOTSTRAP,
    members: [memberOne, memberTwo],
    projects: [
      {
        id: "project-1",
        seasonId: "season-1",
        name: "Robot",
        projectType: "robot",
        description: "",
        status: "active",
      },
    ],
    subsystems: [
      {
        id: "subsystem-1",
        projectId: "project-1",
        name: "Drive",
        color: "#123456",
        description: "",
        photoUrl: "",
        iteration: 1,
        isCore: true,
        parentSubsystemId: null,
        responsibleEngineerId: null,
        mentorIds: [],
        risks: [],
      },
    ],
    tasks: [
      baseTask,
      {
        ...baseTask,
        id: "task-2",
        title: "Member two task",
        ownerId: "member-2",
      },
    ],
    reports: [
      {
        id: "report-1",
        reportType: "QA",
        projectId: "project-1",
        workstreamId: null,
        taskId: "task-1",
        milestoneId: null,
        title: "QA one",
        summary: "",
        result: "pass",
        mentorApproved: true,
        createdByMemberId: "member-1",
        notes: "",
        reviewedAt: "2026-04-20",
        createdAt: "2026-04-20T00:00:00.000Z",
      },
      {
        id: "report-2",
        reportType: "QA",
        projectId: "project-1",
        workstreamId: null,
        taskId: "task-2",
        milestoneId: null,
        title: "QA two",
        summary: "",
        result: "pass",
        mentorApproved: true,
        createdByMemberId: "member-2",
        notes: "",
        reviewedAt: "2026-04-21",
        createdAt: "2026-04-21T00:00:00.000Z",
      },
    ],
    risks: [
      {
        id: "risk-1",
        title: "Member one risk",
        detail: "Only Alex should see this",
        severity: "high",
        sourceType: "qa-report",
        sourceId: "report-1",
        attachmentType: "project",
        attachmentId: "project-1",
        mitigationTaskId: "task-1",
      },
      {
        id: "risk-2",
        title: "Member two risk",
        detail: "Blair owns this",
        severity: "high",
        sourceType: "qa-report",
        sourceId: "report-2",
        attachmentType: "project",
        attachmentId: "project-1",
        mitigationTaskId: "task-2",
      },
    ],
  };
}

export function createMetricsBootstrap(): BootstrapPayload {
  const base = createBootstrap();
  const metricsTasks: BootstrapPayload["tasks"] = Array.from({ length: 26 }, (_, index) => ({
    ...baseTask,
    id: `metric-task-${index + 1}`,
    title: `Metric task ${index + 1}`,
    status: index === 0 ? "complete" : index === 1 ? "waiting-for-qa" : "not-started",
    estimatedHours: index < 24 ? 5 : 15,
    ownerId: index % 8 === 0 ? null : "member-1",
    assigneeIds: index % 8 === 0 ? [] : ["member-1"],
    blockers: index === 2 ? ["design review blocked"] : [],
  }));

  return {
    ...base,
    mechanisms: [
      {
        id: "mechanism-1",
        subsystemId: "subsystem-1",
        name: "Drive module",
        description: "",
        googleSheetsUrl: "",
        photoUrl: "",
        iteration: 1,
      },
    ],
    reports: [
      ...base.reports,
      {
        id: "report-qa-waiting",
        reportType: "QA",
        projectId: "project-1",
        workstreamId: null,
        taskId: "metric-task-2",
        milestoneId: null,
        title: "QA waiting",
        summary: "",
        result: "minor-fix",
        mentorApproved: false,
        createdByMemberId: "member-1",
        notes: "",
        reviewedAt: "2026-04-30",
        createdAt: "2026-04-30T00:00:00.000Z",
      },
    ],
    taskBlockers: [
      {
        id: "blocker-1",
        blockedTaskId: "metric-task-3",
        blockerType: "design-issue",
        blockerId: null,
        description: "design issue",
        severity: "high",
        status: "open",
        createdByMemberId: "member-1",
        createdAt: "2026-04-25T00:00:00.000Z",
        resolvedAt: null,
      },
      {
        id: "blocker-2",
        blockedTaskId: "metric-task-4",
        blockerType: "lost-part",
        blockerId: null,
        description: "lost part",
        severity: "medium",
        status: "open",
        createdByMemberId: "member-2",
        createdAt: "2026-04-26T00:00:00.000Z",
        resolvedAt: null,
      },
    ],
    tasks: metricsTasks,
    workLogs: [
      {
        id: "worklog-1",
        taskId: "metric-task-1",
        date: "2026-05-01",
        hours: 39.3,
        participantIds: ["member-1"],
        notes: "Initial implementation",
      },
    ],
  };
}
