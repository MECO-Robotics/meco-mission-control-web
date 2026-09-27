import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import type { BootstrapPayload } from "@/types/bootstrap";
import { createScopeBootstrap, ids } from "./workspaceBootstrapScopeFixture";

describe("workspace activity scope", () => {
  it("uses legacy entity ids when action task and subsystem links are missing", () => {
    const payload = createScopeBootstrap();
    payload.actions = [
      { id: "visible", entityType: "task", entityId: "task-visible" },
      { id: "hidden-task", entityType: "task", entityId: "task-hidden" },
      { id: "hidden-subsystem", entityType: "subsystem", entityId: "subsystem-hidden" },
    ].map((action) => ({
      actorMemberId: null, changedFields: [], entityLabel: "Task", memberIds: [], message: "Updated",
      operation: "update", projectId: null, subsystemId: null, taskId: null,
      timestamp: "2026-04-20T12:00:00.000Z", ...action,
    })) as BootstrapPayload["actions"];

    expect(ids(scopeBootstrapBySelection(payload, "season-1", "project-visible").actions)).toEqual(["visible"]);
  });

  it("keeps delete actions in scope using their task or subsystem context", () => {
    const payload = createScopeBootstrap();
    payload.actions = [
      { id: "delete-visible", taskId: "task-visible" },
      { id: "delete-hidden", taskId: "task-hidden" },
      { id: "delete-hidden-subsystem", subsystemId: "subsystem-hidden" },
    ].map((action) => ({
      actorMemberId: null, changedFields: [], entityId: action.taskId ?? action.subsystemId ?? "",
      entityLabel: "Record", entityType: "task", memberIds: [], message: "Deleted", operation: "delete",
      projectId: null, subsystemId: action.subsystemId ?? null, taskId: action.taskId ?? null,
      timestamp: "2026-04-20T13:00:00.000Z", ...action,
    })) as BootstrapPayload["actions"];

    expect(ids(scopeBootstrapBySelection(payload, "season-1", "project-visible").actions)).toEqual(["delete-visible"]);
  });

  it("keeps reports, findings and typed risk sources together", () => {
    const payload = createScopeBootstrap();
    const report: BootstrapPayload["reports"][number] = {
      id: "qa-visible", reportType: "QA", projectId: "project-visible", taskId: "task-visible",
      milestoneId: null, workstreamId: null, createdByMemberId: null, result: "pass",
      summary: "QA evidence", notes: "Reviewed", createdAt: "2026-09-26",
    };
    payload.reports = [
      report,
      { ...report, id: "practice-visible", reportType: "Practice", taskId: null },
      { ...report, id: "qa-hidden", projectId: "project-hidden", taskId: "task-hidden" },
      { ...report, id: "cross-project-task", taskId: "task-hidden" },
    ];
    payload.reportFindings = payload.reports.map((entry) => ({
      id: `finding-${entry.id}`, reportId: entry.id, mechanismId: null, partInstanceId: null,
      artifactInstanceId: null, issueType: "fit", severity: "low", notes: "Measured",
      spawnedTaskId: null, spawnedIterationId: null, spawnedRiskId: null,
    }));
    payload.risks = payload.reports.map((entry) => ({
      id: `risk-${entry.id}`, title: "Risk", detail: "Check", severity: "low",
      sourceType: entry.reportType === "QA" ? "qa-report" : "test-result", sourceId: entry.id,
      attachmentType: "project", attachmentId: entry.projectId, mitigationTaskId: null,
    }));

    const scoped = scopeBootstrapBySelection(payload, "season-1", "project-visible");
    expect(ids(scoped.reports)).toEqual(["qa-visible", "practice-visible"]);
    expect(scoped.reportFindings.map(({ reportId }) => reportId)).toEqual(["qa-visible", "practice-visible"]);
    expect(scoped.risks.map(({ sourceId }) => sourceId)).toEqual(["qa-visible", "practice-visible"]);
    expect(scoped.reports[0]).toEqual(report);
  });
});
