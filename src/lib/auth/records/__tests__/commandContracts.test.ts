import { readFileSync } from "node:fs";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { taskToPayload } from "@/lib/appUtils/taskTargets";
import { subsystemToPayload } from "@/lib/appUtils/payloadConversions";
import { createTask } from "../task";
import { createSubsystemRecord } from "../structure";
import { requestItem } from "../common";
import { normalizeBootstrapPayload } from "../../bootstrap/payload";

jest.mock("../common", () => ({ requestItem: jest.fn() }));
const contract = JSON.parse(readFileSync("contracts/platform/bootstrap/v1/contract.json", "utf8"));

it.each(["task", "subsystem"])("%s editor emits only fields accepted by the canonical command", async (kind) => {
  const bootstrap = createBootstrap();
  if (kind === "task") {
    const draft = taskToPayload(bootstrap.tasks[0], bootstrap);
    draft.taskDependencies = [{ kind: "task", refId: "upstream", requiredState: "in-progress", dependencyType: "hard" }];
    await createTask(draft);
  } else {
    await createSubsystemRecord(subsystemToPayload({ ...bootstrap.subsystems[0], isCore: true, layoutX: 0.7, layoutY: 0.4, layoutZone: "front", layoutView: "top", sortOrder: 1 }));
  }
  const body = jest.mocked(requestItem).mock.calls.at(-1)![2] as Record<string, unknown>;
  const serialized = JSON.parse(JSON.stringify(body));
  expect(Object.keys(serialized).filter((key) => !(key in contract.x_commands[kind].properties))).toEqual([]);
  expect(contract.x_commands[kind].required.filter((key: string) => !(key in serialized))).toEqual([]);
  expect(serialized).not.toHaveProperty("id");
  expect(serialized).not.toHaveProperty("actualHours");
  expect(serialized).not.toHaveProperty("blockers");
  expect(serialized).not.toHaveProperty("dependencyIds");
  expect(serialized).not.toHaveProperty("taskDependencies");
  if (kind === "subsystem") expect(serialized).toMatchObject({ layoutX: 0.7, layoutY: 0.4, layoutZone: "front", layoutView: "top", sortOrder: 1 });
});

it("retains authoritative blocking flags and QA risk proposals after bootstrap conversion", () => {
  const bootstrap = createBootstrap();
  bootstrap.tasks[0] = { ...bootstrap.tasks[0], isBlocked: true, isWaitingOnDependency: true };
  const report = { id: "report-1", reportType: "QA" as const, projectId: bootstrap.projects[0].id, taskId: bootstrap.tasks[0].id, milestoneId: null, workstreamId: null, createdByMemberId: null, result: "pass", summary: "Reassess", notes: "Reviewed", evidenceNotes: "Bench test log 12", qaRequestId: "request-1", mentorId: "mentor-1", requestedById: "member-1", photoUrl: "", createdAt: "2026-09-08", targetRiskId: "risk-1", proposedRiskSeverity: "low" as const, proposedRiskStatus: "full-mitigation" as const };
  bootstrap.reports = [report];
  const normalized = normalizeBootstrapPayload(bootstrap);
  expect(normalized.tasks[0]).toMatchObject({ isBlocked: true, isWaitingOnDependency: true });
  expect(normalized.qaReports[0]).toMatchObject({ evidenceNotes: "Bench test log 12", qaRequestId: "request-1", mentorId: "mentor-1", requestedById: "member-1", targetRiskId: "risk-1", proposedRiskSeverity: "low", proposedRiskStatus: "full-mitigation" });
});
