import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import type { BootstrapPayload } from "@/types/bootstrap";
import { createScopeBootstrap, ids } from "./workspaceBootstrapScopeFixture";

describe("workspace activity scope", () => {
  it("scopes actions by their explicit task or subsystem relationship", () => {
    const payload = createScopeBootstrap();
    payload.actions = [
      { id: "visible", entityType: "task", entityId: "task-visible", taskId: "task-visible" },
      { id: "hidden-task", entityType: "task", entityId: "task-hidden", taskId: "task-hidden" },
      { id: "hidden-subsystem", entityType: "subsystem", entityId: "subsystem-hidden", subsystemId: "subsystem-hidden" },
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
      id: "qa-visible", reportType: "qa", projectId: "project-visible",
      targetRefs: [{ kind: "task", id: "task-visible" }],
      createdByMemberId: null, participantIds: [], mentorId: null, requestedById: null,
      result: "pass", status: "submitted", summary: "QA evidence", notes: "Reviewed", createdAt: "2026-09-26",
    };
    payload.reports = [
      report,
      { ...report, id: "practice-visible", reportType: "practice", targetRefs: [] },
      { ...report, id: "qa-hidden", projectId: "project-hidden", targetRefs: [{ kind: "task", id: "task-hidden" }] },
      { ...report, id: "cross-project-task", targetRefs: [{ kind: "task", id: "task-hidden" }] },
    ];
    payload.qaFindings = payload.reports.map((entry) => ({
      id: `finding-${entry.id}`, reportId: entry.id, projectId: entry.projectId, targetRefs: [],
      title: "Fit issue", detail: "Measured", severity: "low", status: "open",
      createdAt: "2026-09-26", updatedAt: "2026-09-26",
    }));
    payload.risks = payload.reports.map((entry) => ({
      id: `risk-${entry.id}`, projectId: entry.projectId, title: "Risk", detail: "Check",
      category: "qa", severity: "low", status: "open", blocksWork: false,
      source: { kind: "report", id: entry.id }, relatedTargets: [], mitigationTaskId: null,
      ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-09-26", updatedAt: "2026-09-26", resolvedAt: null,
    }));

    const scoped = scopeBootstrapBySelection(payload, "season-1", "project-visible");
    expect(ids(scoped.reports)).toEqual(["qa-visible", "practice-visible", "cross-project-task"]);
    expect(scoped.qaFindings.map(({ reportId }) => reportId)).toEqual(["qa-visible", "practice-visible", "cross-project-task"]);
    expect(scoped.risks.map(({ source }) => source.kind === "manual" ? null : source.id)).toEqual(["qa-visible", "practice-visible", "cross-project-task"]);
    expect(scoped.reports[0]).toEqual(report);
  });
});
