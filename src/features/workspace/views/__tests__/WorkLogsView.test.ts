/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import {
  actionMatchesSearch,
  selectActivityActions,
} from "@/features/workspace/views/workLogs/workLogsViewState";
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
    expect(html).toContain("Group: Person");
    expect(html).toContain("Drive CAD");
    expect(html).toContain("Student One");
    expect(html).toContain("Created worklog Drive CAD");
  });

  it("renders the active worklog board as the worklogs kanban view", () => {
    const html = renderWorkLogsView("kanban", {
      tasks: [
        {
          actualHours: 2,
          artifactId: null,
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
          notes: "Need help with sensor bringup",
          participantIds: ["student-1"],
          taskId: "task-1",
        },
      ],
    });

    expect(html).toContain("Active worklog board");
    expect(html).toContain("Active");
    expect(html).toContain("Paused");
    expect(html).toContain("Blocked");
    expect(html).toContain("Waiting QA");
    expect(html).toContain("Closed");
    expect(html).toContain("Student One");
    expect(html).toContain("Drive CAD");
    expect(html).toContain("1.5h elapsed");
    expect(html).toContain("Recent: May 1 - Need help with sensor bringup");
    expect(html).toContain("Need help");
    expect(html).not.toContain("Group: Subsystem");
    expect(html).not.toContain("Logged work on Drive CAD");
  });

  it("renders useful empty states on the active worklog board", () => {
    const html = renderWorkLogsView("kanban");

    expect(html).toContain("No active worklogs");
    expect(html).toContain("In-progress task logs land here when students are actively working.");
    expect(html).toContain("No paused worklogs");
    expect(html).toContain("Paused project or not-started task logs land here until work resumes.");
    expect(html).toContain("No blocked worklogs");
    expect(html).toContain("Blocked task logs appear here when a blocker or dependency needs attention.");
    expect(html).toContain("No QA worklogs");
    expect(html).toContain("Logs for tasks waiting on mentor QA appear here.");
    expect(html).toContain("No closed worklogs");
    expect(html).toContain("Completed task logs land here after work is closed.");
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

  it("builds legacy activity from the unfiltered scoped work log source", () => {
    const task: BootstrapPayload["tasks"][number] = {
      actualHours: 2,
      artifactId: null,
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
      artifactId: null,
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
