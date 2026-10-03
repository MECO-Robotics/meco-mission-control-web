/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

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
        },
      },
      view,
    }),
  );
}

describe("WorkLogsView", () => {
  it("keeps work log totals within Activity", () => {
    const html = renderWorkLogsView("logs");

    expect(html).toContain("0 logs");
    expect(html).toContain("contributors");
  });

  it("renders activity entries for logged work", () => {
    const html = renderWorkLogsView("activity", {
      tasks: [
        {
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
          subsystemIds: ["subsystem-1"],
          summary: "Updated drivetrain CAD",
          title: "Drive CAD",
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

    expect(html).toContain("Changes across the current workspace");
    expect(html).toContain("Group: Person");
    expect(html).toContain("Drive CAD");
    expect(html).toContain("Student One");
    expect(html).toContain("Created worklog Drive CAD");
  });

  it("keeps QA and milestone history as filters rather than duplicate task lists", () => {
    const base = { projectId: "p", targetRefs: [], createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null, result: "pass", status: "submitted" as const, notes: "", createdAt: "2026-09-10" };
    const reports: BootstrapPayload["reports"] = [
      { ...base, id: "qa", reportType: "qa", summary: "Sensor QA" },
      { ...base, id: "result", reportType: "review", summary: "Scrimmage result" },
    ];
    const qa = renderWorkLogsView("qa", { reports });
    expect(qa).toContain("Sensor QA");
    expect(qa).not.toContain("Scrimmage result");
    const milestones = renderWorkLogsView("results", { reports });
    expect(milestones).toContain("Scrimmage result");
    expect(milestones).not.toContain("Sensor QA");
    expect(renderWorkLogsView("qa")).toContain("No results recorded yet");
  });

  it("falls back to work logs when audit actions are unavailable", () => {
    const html = renderWorkLogsView("activity", {
      tasks: [
        {
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
          subsystemIds: ["subsystem-1"],
          summary: "Updated drivetrain CAD",
          title: "Drive CAD",
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
});
