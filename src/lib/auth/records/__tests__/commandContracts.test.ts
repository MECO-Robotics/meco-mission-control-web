import { readFileSync } from "node:fs";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { taskToPayload } from "@/lib/appUtils/taskTargets";
import { subsystemToPayload } from "@/lib/appUtils/payloadConversions";
import { createTask } from "../task";
import { createSubsystemRecord } from "../structure";
import { deleteResponsibleGroup } from "../responsibleGroups";
import { archiveManufacturingProcessRecord, createManufacturingProcessRecord } from "../production";
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
  expect(serialized).not.toHaveProperty("blockers");
  expect(serialized).not.toHaveProperty("dependencyIds");
  expect(serialized).not.toHaveProperty("taskDependencies");
  if (kind === "subsystem") expect(serialized).toMatchObject({ layoutX: 0.7, layoutY: 0.4, layoutZone: "front", layoutView: "top", sortOrder: 1 });
});

it("manufacturing process catalog controls emit canonical create and archive commands", async () => {
  await createManufacturingProcessRecord({ code: "laser-cut", name: "Laser Cut" });
  await archiveManufacturingProcessRecord("process-cnc");
  const createCall = jest.mocked(requestItem).mock.calls.at(-2)!;
  const archiveCall = jest.mocked(requestItem).mock.calls.at(-1)!;
  expect(createCall.slice(0, 3)).toEqual([
    "/manufacturing/processes", "POST", { code: "laser-cut", name: "Laser Cut" },
  ]);
  expect(archiveCall.slice(0, 3)).toEqual([
    "/manufacturing/processes/process-cnc", "PATCH", { isActive: false },
  ]);
  for (const [key, body] of [["manufacturingProcessCreate", createCall[2]], ["manufacturingProcessArchive", archiveCall[2]]] as const) {
    const command = contract.x_commands[key];
    const serialized = JSON.parse(JSON.stringify(body));
    expect(Object.keys(serialized).filter((field) => !(field in command.properties))).toEqual([]);
    expect(command.required.filter((field: string) => !(field in serialized))).toEqual([]);
  }
});

it("team removal uses the ResponsibleGroup delete endpoint", async () => {
  await deleteResponsibleGroup("team-mechanical");
  expect(jest.mocked(requestItem).mock.calls.at(-1)?.slice(0, 3)).toEqual([
    "/responsible-groups/team-mechanical", "DELETE", undefined,
  ]);
});

it("retains typed report targets and evidence after bootstrap normalization", () => {
  const bootstrap = createBootstrap();
  const report = {
    id: "report-1",
    reportType: "qa" as const,
    projectId: bootstrap.projects[0].id,
    targetRefs: [{ kind: "task" as const, id: bootstrap.tasks[0].id }],
    createdByMemberId: null,
    participantIds: ["member-1"],
    mentorId: "mentor-1",
    requestedById: "member-1",
    result: "pass",
    status: "submitted" as const,
    summary: "Reassess",
    notes: "Reviewed",
    evidenceNotes: "Bench test log 12",
    photoUrl: "",
    createdAt: "2026-09-08",
  };
  bootstrap.reports = [report];
  const normalized = normalizeBootstrapPayload(bootstrap);
  expect(normalized.reports[0]).toEqual(report);
});
