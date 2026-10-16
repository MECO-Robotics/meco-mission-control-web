/// <reference types="jest" />

import { actionMatchesSearch } from "@/features/workspace/views/workLogs/workLogsViewState";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord } from "@/types/recordsExecution";

describe("work log activity state", () => {
  it("matches activity search against legacy task subsystem ids", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      assigneeIds: [],
      workTypeId: "work-type-design",
      responsibleGroupId: null,
      dueDate: "2026-05-01",
      estimatedHours: 4,
      id: "task-1",
      mechanismIds: [],
      mentorId: null,
      ownerId: null,
      partInstanceIds: [],
      scheduleRefs: [],
      requestedById: null,
      priority: "medium",
      projectId: "project-1",
      checklistItems: [],
      manufacturingDetails: null,
      requiresDocumentation: false,
      startDate: "2026-05-01",
      status: "in-progress",
      subsystemIds: [],
      summary: "Updated drivetrain CAD",
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
          },
        },
        taskById: { "task-1": task },
      }),
    ).toBe(true);
  });
});
