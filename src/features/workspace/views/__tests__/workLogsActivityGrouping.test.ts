/// <reference types="jest" />

import type { MembersById, SubsystemsById } from "@/features/workspace/shared/model/workspaceTypes";
import {
  DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE,
  WORK_LOG_ACTIVITY_GROUP_OPTIONS,
  buildWorkLogActivityColumns,
} from "@/features/workspace/views/workLogs/workLogsActivityGrouping";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord } from "@/types/recordsExecution";

const task = {
  id: "task-1",
  subsystemId: "subsystem-1",
  subsystemIds: ["subsystem-1"],
  title: "Drive CAD",
} as BootstrapPayload["tasks"][number];

const actions: AuditActionRecord[] = [
  {
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
    subsystemId: "subsystem-1",
    taskId: "task-1",
    timestamp: "2026-05-01T14:30:00.000Z",
  },
  {
    actorMemberId: null,
    changedFields: [],
    entityId: "workspace-1",
    entityLabel: "Workspace cleanup",
    entityType: "workspace",
    id: "action-2",
    memberIds: [],
    message: "Updated workspace cleanup",
    operation: "update",
    projectId: "project-1",
    subsystemId: null,
    taskId: null,
    timestamp: "2026-05-01T15:30:00.000Z",
  },
];

const membersById: MembersById = {
  "student-1": {
    email: "student@meco.dev",
    elevated: false,
    id: "student-1",
    name: "Student One",
    role: "student",
    seasonId: "season-1",
  },
};

const subsystemsById: SubsystemsById = {
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
};

describe("workLogsActivityGrouping", () => {
  it("defaults to person grouping and exposes the available group modes", () => {
    expect(DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE).toBe("person");
    expect(WORK_LOG_ACTIVITY_GROUP_OPTIONS.map((option) => option.id)).toEqual([
      "person",
      "subsystem",
      "task",
      "action",
    ]);
  });

  it.each([
    ["person", ["Student One", "System"]],
    ["subsystem", ["Drive", "Unknown subsystem"]],
    ["task", ["Drive CAD", "General activity"]],
    ["action", ["Create", "Update"]],
  ] as const)("builds %s activity columns", (groupMode, expectedLabels) => {
    const columns = buildWorkLogActivityColumns({
      actions,
      groupMode,
      membersById,
      subsystemsById,
      taskById: { "task-1": task },
    });

    expect(columns.map((column) => column.label)).toEqual(expectedLabels);
  });
});
