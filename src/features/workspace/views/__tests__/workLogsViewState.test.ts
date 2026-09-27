/// <reference types="jest" />

import { actionMatchesSearch, selectActivityActions } from "@/features/workspace/views/workLogs/workLogsViewState";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord } from "@/types/recordsExecution";

describe("work log activity state", () => {
  it("builds legacy activity from the unfiltered scoped work log source", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      artifactIds: [],
      assigneeIds: [],
      blockers: [],

      disciplineId: "discipline-1",
      documentationLinked: false,
      dueDate: "2026-05-01",
      estimatedHours: 4,
      id: "task-1",
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      mechanismIds: [],
      mentorId: null,
      ownerId: null,
      partInstanceIds: [],
      priority: "medium",
      projectId: "project-1",
      requiresDocumentation: false,
      startDate: "2026-05-01",
      status: "in-progress",
      subsystemIds: ["subsystem-1"],
      summary: "Updated drivetrain CAD",
      targetMilestoneId: null,
      title: "Drive CAD",
      workstreamIds: [],
    };

    const actions = selectActivityActions({
      auditActions: [],
      taskById: { "task-1": task },
      workLogs: [
        {
          date: "2026-05-01",
          hours: 1.5,
          id: "worklog-1",
          notes: "Finished first pass",
          participantIds: ["student-1"],
          taskId: "task-1",
        },
      ],
    });

    expect(actions.map((action) => action.id)).toEqual(["legacy-worklog-worklog-1"]);
  });

  it("matches activity search against legacy task subsystem ids", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      artifactIds: [],
      assigneeIds: [],
      blockers: [],

      disciplineId: "discipline-1",
      documentationLinked: false,
      dueDate: "2026-05-01",
      estimatedHours: 4,
      id: "task-1",
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      mechanismIds: [],
      mentorId: null,
      ownerId: null,
      partInstanceIds: [],
      priority: "medium",
      projectId: "project-1",
      requiresDocumentation: false,
      startDate: "2026-05-01",
      status: "in-progress",
      subsystemIds: [],
      summary: "Updated drivetrain CAD",
      targetMilestoneId: null,
      title: "Drive CAD",
      workstreamIds: [],
    };
    const action: AuditActionRecord = {
      actorMemberId: "student-1",
      changedFields: [],
      entityId: "worklog-1",
      entityLabel: "Drive CAD",
      entityType: "worklog",
      id: "action-1",
      memberIds: ["student-1"],
      message: "Created worklog Drive CAD",
      operation: "create",
      projectId: "project-1",
      subsystemId: null,
      taskId: "task-1",
      timestamp: "2026-05-01T14:30:00.000Z",
    };

    expect(
      actionMatchesSearch({
        action,
        membersById: {},
        query: "drive",
        subsystemsById: {
          "subsystem-1": {
            description: "",
            id: "subsystem-1",
            isCore: true,
            iteration: 1,
            mentorIds: [],
            name: "Drive",
            parentSubsystemId: null,
            projectId: "project-1",
            responsibleEngineerId: null,
            risks: [],
          },
        },
        taskById: { "task-1": task },
      }),
    ).toBe(true);
  });
});
