/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderWorkLogsView(
  view: WorklogsViewTab,
  bootstrapOverrides: Partial<BootstrapPayload> = {},
  canReviewFindings = false,
  canCreateQaReport = true,
) {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    ...bootstrapOverrides,
  };

  return renderToStaticMarkup(
    React.createElement(WorkLogsView, {
      activePersonFilter: [],
      bootstrap,
      canReviewFindings,
      canCreateQaReport,
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
      openCreateQaReportModal: jest.fn(),
      openCreateMilestoneReportModal: jest.fn(),
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
  it("keeps work logs free of the extra summary eyebrow", () => {
    const html = renderWorkLogsView("logs");

    expect(html).not.toContain("workspace-inline-summary");
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

    expect(html).not.toContain("Changes across the current workspace");
    expect(html).toContain('class="ops-table ops-table-header worklog-activity-table"');
    expect(html).toContain("Date");
    expect(html).toContain("Action");
    expect(html).not.toContain("Group: Person");
    expect(html).toContain("Drive CAD");
    expect(html).toContain("Student One");
    expect(html).toContain("Created worklog Drive CAD");
  });

  it("does not provide a Log work action on Activity", () => {
    const html = renderWorkLogsView("activity");

    expect(html).not.toContain('aria-label="Log work"');
    expect(html).not.toContain('class="topbar-add-button topbar-add-menu-trigger secondary-action icon-button"');
  });

  it("provides the shared Add QA report plus action on QA reports", () => {
    const html = renderWorkLogsView("qa");

    expect(html).toContain('aria-label="Add QA report"');
    expect(html).toContain('class="topbar-add-button topbar-add-menu-trigger secondary-action icon-button"');
  });

  it("hides QA creation for student roles while retaining work logging", () => {
    expect(renderWorkLogsView("qa", {}, false, false)).not.toContain('aria-label="Add QA report"');
    expect(renderWorkLogsView("logs", {}, false, false)).toContain('aria-label="Log work"');
  });

  it("provides the shared Add milestone report plus action on Results", () => {
    const html = renderWorkLogsView("results");

    expect(html).toContain('aria-label="Add milestone report"');
    expect(html).toContain('class="topbar-add-button topbar-add-menu-trigger secondary-action icon-button"');
  });

  it("keeps QA and milestone history as filters rather than duplicate task lists", () => {
    const base = { projectId: "p", targetRefs: [], createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null, result: "pass", status: "submitted" as const, notes: "", createdAt: "2026-09-10" };
    const reports: BootstrapPayload["reports"] = [
      { ...base, id: "qa", reportType: "qa", summary: "Sensor QA" },
      { ...base, id: "result", reportType: "review", summary: "Scrimmage result" },
    ];
    const qa = renderWorkLogsView("qa", { reports });
    expect(qa).toContain("Sensor QA");
    expect(qa).toContain("qa-report-list");
    expect(qa).toContain("Outcome");
    expect(qa).toContain("Submitted · waiting for review");
    expect(qa).toContain("Not reviewed");
    expect(qa).not.toContain(">pass</span>");
    expect(qa).not.toContain("Scrimmage result");
    const milestones = renderWorkLogsView("results", { reports });
    expect(milestones).toContain("Scrimmage result");
    expect(milestones).not.toContain("Sensor QA");
    expect(renderWorkLogsView("qa")).toContain("No QA reports yet");
  });

  it("orders QA recent history by server review order, labels date fallback, and separates observed date", () => {
    const base = { projectId: "project-1", targetRefs: [], createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null, summary: "", notes: "", createdAt: "2026-10-15T00:00:00.000Z" };
    const reports: BootstrapPayload["reports"] = [
      { ...base, id: "old-pass", reportType: "qa", summary: "Earlier pass", result: "pass", status: "reviewed", createdAt: "2099-12-31T00:00:00.000Z", reviewedAt: "2026-10-10T00:00:00.000Z", reviewOrder: 1 },
      { ...base, id: "new-fail", reportType: "qa", summary: "Later failure", result: "fail", status: "reviewed", createdAt: "2026-10-10T00:00:00.000Z", reviewedAt: "2026-10-15T00:00:00.000Z", reviewOrder: 2 },
      { ...base, id: "legacy", reportType: "qa", summary: "Legacy review", result: "pass", status: "reviewed", reviewedAt: "2026-10-12T00:00:00.000Z" },
      { ...base, id: "submitted", reportType: "qa", summary: "Still waiting", result: "pass", status: "submitted", createdAt: "2100-01-01T00:00:00.000Z" },
    ];
    const html = renderWorkLogsView("qa", { reports });
    expect(html.indexOf("Later failure")).toBeLessThan(html.indexOf("Earlier pass"));
    expect(html.indexOf("Earlier pass")).toBeLessThan(html.indexOf("Legacy review"));
    expect(html.indexOf("Legacy review")).toBeLessThan(html.indexOf("Still waiting"));
    expect(html).toContain("Order unavailable · sorted by review date");
    expect(html).toContain("Observed: 2099-12-31T00:00:00.000Z");
    expect(html).toContain("Not reviewed");
  });

  it("shows unknown verification and exposes retest only to reviewers", () => {
    const report: BootstrapPayload["reports"][number] = {
      id: "report-qa", reportType: "qa", projectId: "project-1", targetRefs: [], createdByMemberId: null,
      participantIds: [], mentorId: null, requestedById: null, summary: "Wheel check", notes: "", status: "reviewed",
      result: "pass", createdAt: "2026-10-10T00:00:00.000Z", reviewedAt: "2026-10-11T00:00:00.000Z", reviewedById: "mentor-1",
    };
    const finding: BootstrapPayload["qaFindings"][number] = {
      id: "finding-1", reportId: report.id, projectId: "project-1", targetRefs: [], title: "Loose wheel nut", detail: "Check torque again.",
      severity: "medium", status: "open", createdAt: "2026-10-10T00:00:00.000Z", updatedAt: "2026-10-10T00:00:00.000Z",
    };
    const data = { reports: [report], qaFindings: [finding], testFindings: [{ ...finding, id: "test-finding-1", testResultId: "test-result-1" }] };
    const student = renderWorkLogsView("qa", data);
    expect(student).toContain("This review needs another check");
    expect(student).not.toContain(">Record retest</button>");
    const mentor = renderWorkLogsView("qa", data, true);
    expect(mentor).toMatch(/>\s*Record retest<\/button>/);
    expect(mentor).not.toContain("Retests are temporarily unavailable");
    expect(mentor).toContain("Wheel check");
    const results = renderWorkLogsView("results", data, true);
    expect(results).toContain("Test findings");
    expect(results).toMatch(/>\s*Record retest<\/button>/);
    expect(student).not.toContain("Test findings");

    const platformBootstrap = createBootstrap();
    const stale = renderWorkLogsView("qa", {
      ...data,
      partInstances: platformBootstrap.partInstances,
      reports: [{ ...report, targetRefs: [{ kind: "task", id: platformBootstrap.tasks[0].id }], inspectedPartInstanceIds: [], reviewOrder: 1, needsReverification: false }],
      tasks: [{ ...platformBootstrap.tasks[0], partInstanceIds: ["new-part"] }],
    }, true);
    expect(stale).toContain("Some current parts were added after this review.");
  });

  it("does not synthesize activity entries when audit actions are unavailable", () => {
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

    expect(html).toContain("No activity matches the current filters.");
    expect(html).not.toContain("Drive CAD");
    expect(html).not.toContain("Logged work on Drive CAD");
  });
});
