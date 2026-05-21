/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import type {
  MembersById,
  SubsystemsById,
} from "@/features/workspace/shared/model/workspaceTypes";
import {
  DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE,
  WORK_LOG_ACTIVITY_GROUP_OPTIONS,
  buildWorkLogActivityColumns,
} from "@/features/workspace/views/workLogs/workLogsActivityGrouping";
import { actionMatchesSearch } from "@/features/workspace/views/workLogs/workLogsViewState";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";
import type { AuditActionRecord } from "@/types/recordsExecution";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderWorkLogsView(
  view: WorklogsViewTab,
  bootstrapOverrides: Partial<BootstrapPayload> = {},
) {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    ...bootstrapOverrides,
  };

  return renderToStaticMarkup(
    React.createElement(WorkLogsView, {
      activePersonFilter: [],
      bootstrap,
      membersById: {
        "student-1": {
          email: "student@meco.dev",
          elevated: false,
          id: "student-1",
          name: "Student One",
          role: "student",
          seasonId: "season-1",
        },
      },
      openCreateWorkLogModal: jest.fn(),
      openEditTaskModal: jest.fn(),
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
      view,
    }),
  );
}

describe("WorkLogsView", () => {
  it("renders the work log summary tab", () => {
    const html = renderWorkLogsView("summary");

    expect(html).toContain("Work log summary");
    expect(html).toContain("Top contributors");
  });

  it("renders activity entries for logged work", () => {
    const html = renderWorkLogsView("activity", {
      tasks: [
        {
          actualHours: 2,
          artifactId: null,
          artifactIds: [],
          assigneeIds: [],
          blockers: [],
          dependencyIds: [],
          disciplineId: "discipline-1",
          documentationLinked: false,
          dueDate: "2026-05-01",
          estimatedHours: 4,
          id: "task-1",
          linkedManufacturingIds: [],
          linkedPurchaseIds: [],
          mechanismId: null,
          mechanismIds: [],
          mentorId: null,
          ownerId: null,
          partInstanceId: null,
          partInstanceIds: [],
          priority: "medium",
          projectId: "project-1",
          requiresDocumentation: false,
          startDate: "2026-05-01",
          status: "in-progress",
          subsystemId: "subsystem-1",
          subsystemIds: ["subsystem-1"],
          summary: "Updated drivetrain CAD",
          targetMilestoneId: null,
          title: "Drive CAD",
          workstreamId: null,
          workstreamIds: [],
        },
      ],
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
      actions: [
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
      ],
    });

    expect(html).toContain("Activity");
    expect(html).toContain("Recent workspace activity");
    expect(html).toContain("Drive CAD");
    expect(html).toContain("Student One");
    expect(html).toContain("Created worklog Drive CAD");
  });

  it("defaults activity grouping to person and supports kanban regrouping", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      artifactId: null,
      artifactIds: [],
      assigneeIds: [],
      blockers: [],
      dependencyIds: [],
      disciplineId: "discipline-1",
      documentationLinked: false,
      dueDate: "2026-05-01",
      estimatedHours: 4,
      id: "task-1",
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      mechanismId: null,
      mechanismIds: [],
      mentorId: null,
      ownerId: null,
      partInstanceId: null,
      partInstanceIds: [],
      priority: "medium",
      projectId: "project-1",
      requiresDocumentation: false,
      startDate: "2026-05-01",
      status: "in-progress",
      subsystemId: "subsystem-1",
      subsystemIds: ["subsystem-1"],
      summary: "Updated drivetrain CAD",
      targetMilestoneId: null,
      title: "Drive CAD",
      workstreamId: null,
      workstreamIds: [],
    };
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
    const columnArgs = {
      actions,
      membersById,
      subsystemsById,
      taskById: { "task-1": task },
    };

    expect(DEFAULT_WORK_LOG_ACTIVITY_GROUP_MODE).toBe("person");
    expect(WORK_LOG_ACTIVITY_GROUP_OPTIONS.map((option) => option.id)).toEqual([
      "person",
      "subsystem",
      "task",
      "action",
    ]);
    expect(
      buildWorkLogActivityColumns({
        ...columnArgs,
        groupMode: "person",
      }).map((column) => column.label),
    ).toEqual(["Student One", "System"]);
    expect(
      buildWorkLogActivityColumns({
        ...columnArgs,
        groupMode: "subsystem",
      }).map((column) => column.label),
    ).toEqual(["Drive", "Unknown subsystem"]);
    expect(
      buildWorkLogActivityColumns({
        ...columnArgs,
        groupMode: "task",
      }).map((column) => column.label),
    ).toEqual(["Drive CAD", "General activity"]);
    expect(
      buildWorkLogActivityColumns({
        ...columnArgs,
        groupMode: "action",
      }).map((column) => column.label),
    ).toEqual(["Create", "Update"]);

    const html = renderWorkLogsView("activity", {
      actions,
      tasks: [task],
    });

    expect(html).toContain("Group: Person");
    expect(html).toContain("Person");
  });

  it("falls back to work logs when audit actions are unavailable", () => {
    const html = renderWorkLogsView("activity", {
      tasks: [
        {
          actualHours: 2,
          artifactId: null,
          artifactIds: [],
          assigneeIds: [],
          blockers: [],
          dependencyIds: [],
          disciplineId: "discipline-1",
          documentationLinked: false,
          dueDate: "2026-05-01",
          estimatedHours: 4,
          id: "task-1",
          linkedManufacturingIds: [],
          linkedPurchaseIds: [],
          mechanismId: null,
          mechanismIds: [],
          mentorId: null,
          ownerId: null,
          partInstanceId: null,
          partInstanceIds: [],
          priority: "medium",
          projectId: "project-1",
          requiresDocumentation: false,
          startDate: "2026-05-01",
          status: "in-progress",
          subsystemId: "subsystem-1",
          subsystemIds: ["subsystem-1"],
          summary: "Updated drivetrain CAD",
          targetMilestoneId: null,
          title: "Drive CAD",
          workstreamId: null,
          workstreamIds: [],
        },
      ],
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
      actions: [],
    });

    expect(html).toContain("Drive CAD");
    expect(html).toContain("Logged work on Drive CAD");
  });

  it("matches activity search against legacy task subsystem ids", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      artifactId: null,
      artifactIds: [],
      assigneeIds: [],
      blockers: [],
      dependencyIds: [],
      disciplineId: "discipline-1",
      documentationLinked: false,
      dueDate: "2026-05-01",
      estimatedHours: 4,
      id: "task-1",
      linkedManufacturingIds: [],
      linkedPurchaseIds: [],
      mechanismId: null,
      mechanismIds: [],
      mentorId: null,
      ownerId: null,
      partInstanceId: null,
      partInstanceIds: [],
      priority: "medium",
      projectId: "project-1",
      requiresDocumentation: false,
      startDate: "2026-05-01",
      status: "in-progress",
      subsystemId: "subsystem-1",
      subsystemIds: [],
      summary: "Updated drivetrain CAD",
      targetMilestoneId: null,
      title: "Drive CAD",
      workstreamId: null,
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
