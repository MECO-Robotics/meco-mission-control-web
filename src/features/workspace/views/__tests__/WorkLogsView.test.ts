/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { WorkLogsView } from "@/features/workspace/views/WorkLogsView";
import { filterTestFindingsForHistory } from "@/features/workspace/views/workLogs/workLogsViewStateData";
import type { WorklogsViewTab } from "@/lib/workspaceNavigation";
import type { BootstrapPayload } from "@/types/bootstrap";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderWorkLogsView(
  view: WorklogsViewTab,
  bootstrapOverrides: Partial<BootstrapPayload> = {},
  canReviewFindings = false,
  canCreateQaReport = true,
  activePersonFilter: string[] = [],
) {
  const bootstrap: BootstrapPayload = {
    ...EMPTY_BOOTSTRAP,
    ...bootstrapOverrides,
  };

  return renderToStaticMarkup(
    React.createElement(WorkLogsView, {
      activePersonFilter,
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

  it("offers both report creation actions in the shared Results menu", () => {
    const html = renderWorkLogsView("reports");

    expect(html).toContain('aria-label="Add report"');
    expect(html).toContain("Add QA report");
    expect(html).toContain("Add milestone report");
    expect(html).toContain('class="topbar-add-button topbar-add-menu-trigger secondary-action icon-button"');
  });

  it("hides QA creation for student roles while retaining milestone report creation", () => {
    const reports = renderWorkLogsView("reports", {}, false, false);
    expect(reports).not.toContain("Add QA report");
    expect(reports).toContain('aria-label="Add milestone report"');
    expect(renderWorkLogsView("logs", {}, false, false)).toContain('aria-label="Log work"');
  });

  it("renders QA, milestone, and test finding records in the same results list", () => {
    const base = { projectId: "p", targetRefs: [], createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null, result: "pass", status: "submitted" as const, notes: "", createdAt: "2026-09-10" };
    const reports: BootstrapPayload["reports"] = [
      { ...base, id: "qa", reportType: "qa", summary: "Sensor QA" },
      { ...base, id: "result", reportType: "practice", summary: "Scrimmage result", result: "Strong finish" },
    ];
    const html = renderWorkLogsView("reports", {
      reports,
      testResults: [{ id: "test-result", projectId: "p", targetRefs: [], title: "Drive vibration", status: "fail" }],
      testFindings: [
        { id: "test-finding", reportId: null, testResultId: "test-result", projectId: "p", targetRefs: [], title: "Drive mount", detail: "Retorque bolts", severity: "medium", status: "open", createdAt: "2026-09-11", updatedAt: "2026-09-11" },
        { id: "orphan-finding", reportId: null, testResultId: "missing-result", projectId: "p", targetRefs: [], title: "Orphan finding", detail: "Check record linkage", severity: "low", status: "open", createdAt: "2026-09-09", updatedAt: "2026-09-09" },
      ],
    });
    expect(html).toContain("Sensor QA");
    expect(html).toContain("Scrimmage result");
    expect(html).toContain("results-report-list");
    expect(html).toContain("Outcome");
    expect(html).toContain("Submitted · waiting for review");
    expect(html).toContain("Strong finish");
    expect(html).toContain("Drive mount");
    expect(html).toContain("Orphan finding");
    expect(html).toContain("open · test fail");
    expect(html).toContain("Test result unavailable");
    expect(html).not.toContain('aria-label="Test findings"');
    expect((html.match(/results-report-list/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain("qa-report-list");
    expect(renderWorkLogsView("reports")).toContain("No results yet");
  });

  it("interleaves reports and test findings by effective date and keeps QA review order visible", () => {
    const base = { projectId: "project-1", targetRefs: [], createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null, summary: "", notes: "", createdAt: "2026-10-15T00:00:00.000Z" };
    const reports: BootstrapPayload["reports"] = [
      { ...base, id: "old-pass", reportType: "qa", summary: "Earlier pass", result: "pass", status: "reviewed", createdAt: "2099-12-31T00:00:00.000Z", reviewedAt: "2026-10-10T00:00:00.000Z", reviewOrder: 1 },
      { ...base, id: "new-fail", reportType: "qa", summary: "Later failure", result: "fail", status: "reviewed", createdAt: "2026-10-10T00:00:00.000Z", reviewedAt: "2026-10-15T00:00:00.000Z", reviewOrder: 2 },
      { ...base, id: "legacy", reportType: "qa", summary: "Legacy review", result: "pass", status: "reviewed", reviewedAt: "2026-10-12T00:00:00.000Z" },
      { ...base, id: "milestone", reportType: "practice", summary: "Scrimmage result", result: "Strong finish", status: "submitted", createdAt: "2026-10-13T00:00:00.000Z" },
      { ...base, id: "submitted", reportType: "qa", summary: "Still waiting", result: "pass", status: "submitted", createdAt: "2026-10-09T00:00:00.000Z" },
    ];
    const html = renderWorkLogsView("reports", {
      reports,
      testResults: [{ id: "test-result", projectId: "project-1", targetRefs: [], title: "Drive vibration", status: "fail" }],
      testFindings: [{ id: "test-finding", reportId: null, testResultId: "test-result", projectId: "project-1", targetRefs: [], title: "Drive mount", detail: "Retorque bolts", severity: "medium", status: "open", createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-14T00:00:00.000Z" }],
    });
    expect(html.indexOf("Later failure")).toBeLessThan(html.indexOf("Earlier pass"));
    expect(html.indexOf("Later failure")).toBeLessThan(html.indexOf("Drive mount"));
    expect(html.indexOf("Drive mount")).toBeLessThan(html.indexOf("Scrimmage result"));
    expect(html.indexOf("Scrimmage result")).toBeLessThan(html.indexOf("Legacy review"));
    expect(html.indexOf("Legacy review")).toBeLessThan(html.indexOf("Earlier pass"));
    expect(html.indexOf("Earlier pass")).toBeLessThan(html.indexOf("Still waiting"));
    expect(html).toContain("Review order unavailable");
    expect(html).toContain("Review 1");
    expect(html).toContain("Observed: 2099-12-31T00:00:00.000Z");
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
    const data = { reports: [report], qaFindings: [finding], testResults: [{ id: "test-result-1", projectId: report.projectId, targetRefs: [], title: "Wheel test", status: "fail" as const }], testFindings: [{ ...finding, id: "test-finding-1", testResultId: "test-result-1" }] };
    const student = renderWorkLogsView("reports", data);
    expect(student).toContain("This review needs another check");
    expect(student).not.toContain(">Record retest</button>");
    expect(student).toContain("Loose wheel nut");
    expect(student).toContain("Test finding · Wheel test");
    const mentor = renderWorkLogsView("reports", data, true);
    expect(mentor).toMatch(/>\s*Record retest<\/button>/);
    expect(mentor).not.toContain("Retests are temporarily unavailable");
    expect(mentor).toContain("Wheel check");

    const platformBootstrap = createBootstrap();
    const stale = renderWorkLogsView("reports", {
      ...data,
      partInstances: platformBootstrap.partInstances,
      reports: [{ ...report, targetRefs: [{ kind: "task", id: platformBootstrap.tasks[0].id }], inspectedPartInstanceIds: [], reviewOrder: 1, needsReverification: false }],
      tasks: [{ ...platformBootstrap.tasks[0], partInstanceIds: ["new-part"] }],
    }, true);
    expect(stale).toContain("Some current parts were added after this review.");
  });

  it("filters test retests with the Results search and person filters through their canonical test result", () => {
    const bootstrap = createBootstrap();
    const [task] = bootstrap.tasks;
    bootstrap.tasks = [
      { ...task, id: "task-for-current-person", title: "Drive test", ownerId: "student-1", assigneeIds: ["student-1"] },
      { ...task, id: "task-for-other-person", title: "Pump test", ownerId: "other-student", assigneeIds: ["other-student"] },
    ];
    bootstrap.testResults = [
      { id: "drive-result", projectId: task.projectId, targetRefs: [{ kind: "task", id: "task-for-current-person" }], title: "Drive vibration", status: "fail" },
      { id: "pump-result", projectId: task.projectId, targetRefs: [{ kind: "task", id: "task-for-other-person" }], title: "Pump pressure", status: "fail" },
    ];
    bootstrap.testFindings = [
      { id: "drive-finding", reportId: null, testResultId: "drive-result", projectId: task.projectId, targetRefs: [], title: "Drive mount", detail: "Retorque", severity: "medium", status: "open", createdAt: "2026-10-16", updatedAt: "2026-10-16" },
      { id: "pump-finding", reportId: null, testResultId: "pump-result", projectId: task.projectId, targetRefs: [], title: "Pump seal", detail: "Inspect", severity: "medium", status: "open", createdAt: "2026-10-16", updatedAt: "2026-10-16" },
    ];
    const matching = filterTestFindingsForHistory(bootstrap.testFindings, bootstrap.testResults, ["student-1"], "drive", Object.fromEntries(bootstrap.tasks.map((entry) => [entry.id, entry])));
    expect(matching.map(({ finding }) => finding.id)).toEqual(["drive-finding"]);

    const html = renderWorkLogsView("reports", bootstrap, true, true, ["student-1"]);
    expect(html).toContain("Drive mount");
    expect(html).not.toContain("Pump seal");
    expect(html).not.toContain('aria-label="Test findings"');
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
