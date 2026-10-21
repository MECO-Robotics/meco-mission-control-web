import { createBootstrap } from "../../__tests__/riskViewTestFixtures";
import type { AttentionQueueRow } from "../../attention/attentionQueue";
import { buildHomePressureGroups, groupHomeActions } from "../homePressureModel";
import { buildAttentionQueue } from "../../attention/attentionQueue";

const row = (key: string, overrides: Partial<AttentionQueueRow> = {}): AttentionQueueRow => ({
  key, recordId: key, source: "task", action: "open-task", title: key, context: "",
  reasons: [], urgency: 100, ownerMemberId: null, priority: "high", status: "open",
  dueDate: null, signals: ["blocked", "overdue"], needsReview: false,
  projectId: "project-1", ...overrides,
});
const fixture = () => {
  const bootstrap = createBootstrap();
  bootstrap.responsibleGroups = ["a", "b"].map(id => ({
    id, name: `Team ${id}`, icon: "users", color: "#4F86C6", seasonId: "season-1", projectIds: ["project-1"],
    workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false,
  }));
  bootstrap.tasks = [
    { ...bootstrap.tasks[0], id: "one", responsibleGroupId: "a", workstreamIds: ["first", "first"], ownerId: "person-1" },
    { ...bootstrap.tasks[0], id: "two", responsibleGroupId: "b", workstreamIds: ["second"], ownerId: "person-2" },
    { ...bootstrap.tasks[0], id: "elsewhere", projectId: "project-2", responsibleGroupId: "b", workstreamIds: [] },
  ];
  bootstrap.workstreams = [
    { id: "first", name: "Build", projectId: "project-1", description: "" },
    { id: "second", name: "Build", projectId: "project-2", description: "" },
  ];
  bootstrap.projects.push({ ...bootstrap.projects[0], id: "project-2", name: "Media" });
  return bootstrap;
};

test("urgency chooses the first signal and counts a record only once", () => {
  const action = row("one");
  const groups = groupHomeActions([action, action, row("other", { signals: [] })]);
  expect(groups.find(group => group.id === "blocked")?.items.map(item => item.key)).toEqual(["one"]);
  expect(groups.find(group => group.id === "overdue")?.items).toEqual([]);
  expect(groups.find(group => group.id === "other")?.items).toHaveLength(1);
});

test("uses recorded task teams without inferring member or project memberships", () => {
  const bootstrap = fixture();
  bootstrap.tasks[1].responsibleGroupId = null;
  bootstrap.tasks[2].responsibleGroupId = "missing";
  const groups = buildHomePressureGroups([row("one"), row("two"), row("elsewhere", { projectId: "project-2" })], "team", bootstrap);
  expect(groups.map(group => group.label).sort()).toEqual(["No team", "Team a", "Unknown team (missing)"]);
});

test("risk teams and workstreams use affected work in project and person scope", () => {
  const bootstrap = fixture();
  // This task is mitigation only; it must not attribute its Team b to the risk.
  bootstrap.risks[0].mitigationTaskId = "two";
  bootstrap.risks[0].ownerGroupId = null;
  const risk = row(bootstrap.risks[0].id, { source: "risk", affectedTaskIds: ["one", "elsewhere", "one"] });
  const groups = buildHomePressureGroups([risk], "team", bootstrap);
  expect(groups.map(group => group.label)).toEqual(["Team a"]);
  const selected = buildHomePressureGroups([risk], "team", bootstrap, { activePersonFilter: ["person-2"] });
  expect(selected.map(group => group.label)).toEqual(["No team"]);
  const streams = buildHomePressureGroups([risk], "workstream", bootstrap);
  expect(streams.map(group => group.label)).toEqual(["Build · Robot"]);
  expect(streams[0].items).toHaveLength(1);
});

test("keeps explicit risk owner teams, but does not derive a team from mitigation", () => {
  const bootstrap = fixture();
  bootstrap.risks[0].ownerGroupId = "a";
  bootstrap.risks[0].mitigationTaskId = "two";
  const risk = row(bootstrap.risks[0].id, { source: "risk", affectedTaskIds: [] });
  expect(buildHomePressureGroups([risk], "team", bootstrap).map(group => group.label)).toEqual(["Team a"]);
  expect(buildHomePressureGroups([risk], "workstream", bootstrap).map(group => group.label)).toEqual(["No workstream"]);
});

test("multi-group records overlap honestly, deduplicate links, and sort by count then name", () => {
  const bootstrap = fixture();
  const risk = row("risk", { source: "risk", affectedTaskIds: ["one", "two", "two"] });
  const groups = buildHomePressureGroups([risk, row("two")], "team", bootstrap);
  expect(groups.map(group => [group.label, group.items.length])).toEqual([["Team b", 2], ["Team a", 1]]);
  expect(buildHomePressureGroups([row("one"), row("two")], "workstream", bootstrap).map(group => group.label))
    .toEqual(["Build · Media", "Build · Robot"]);
});

test("subsystems use canonical task targets and qualify duplicate names across projects", () => {
  const bootstrap = fixture();
  bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "other-drive", projectId: "project-2" });
  bootstrap.tasks[0].subsystemIds = ["subsystem-1", "subsystem-1"];
  bootstrap.tasks[1].subsystemIds = ["other-drive"];
  const groups = buildHomePressureGroups([
    row("one", { areaIds: ["subsystem-1", "subsystem-1"] }),
    row("two", { areaIds: ["other-drive"] }), row("none"),
  ], "subsystem", bootstrap);
  expect(groups.map(group => [group.label, group.items.length])).toEqual([
    ["Drive · Media", 1], ["Drive · Robot", 1], ["No subsystem", 1],
  ]);
});

test("project grouping exposes missing associations and missing referenced records", () => {
  const groups = buildHomePressureGroups([
    row("one"), row("two", { projectId: "missing" }), row("none", { projectId: undefined }),
  ], "project", fixture());
  expect(groups.map(group => group.label)).toEqual(["No project", "Robot", "Unknown project (missing)"]);
});

test("risk subsystem pressure re-scopes affected work and excludes mitigation-only areas from queue metadata", () => {
  const bootstrap = fixture();
  bootstrap.subsystems.push(
    { ...bootstrap.subsystems[0], id: "arm", name: "Arm" },
    { ...bootstrap.subsystems[0], id: "mitigation-only", name: "Mitigation only" },
  );
  bootstrap.tasks[1].subsystemIds = ["arm"];
  bootstrap.tasks[2] = { ...bootstrap.tasks[2], projectId: "project-1", ownerId: "person-1", subsystemIds: ["mitigation-only"] };
  bootstrap.risks[0].relatedTargets = [{ kind: "task", id: "one" }, { kind: "task", id: "two" }];
  bootstrap.risks[0].mitigationTaskId = "elsewhere";
  const activePersonFilter = ["person-1"];
  const rows = buildAttentionQueue({ bootstrap, activePersonFilter, projectId: "project-1", today: new Date(2026, 9, 20) });
  const risk = rows.find(item => item.source === "risk")!;
  expect(risk.areaIds).toEqual(expect.arrayContaining(["subsystem-1", "arm", "mitigation-only"]));
  const riskLabels = buildHomePressureGroups(rows, "subsystem", bootstrap, { activePersonFilter })
    .filter(group => group.items.some(item => item.key === risk.key)).map(group => group.label);
  expect(riskLabels).toEqual(["Drive"]);
});

test("risk subsystem pressure retains direct subsystem and mechanism context, including missing references", () => {
  const bootstrap = fixture();
  bootstrap.risks[0].relatedTargets = [{ kind: "subsystem", id: "missing" }, { kind: "mechanism", id: "lost" }];
  const risk = row(bootstrap.risks[0].id, { source: "risk", affectedTaskIds: [] });
  expect(buildHomePressureGroups([risk], "subsystem", bootstrap).map(group => group.label))
    .toEqual(["Unknown mechanism (lost)", "Unknown subsystem (missing)"]);
});

test("individual groups retain explicit risk owner and scoped affected-task participants, never mentor or mitigation", () => {
  const bootstrap = fixture();
  bootstrap.tasks[0].assigneeIds = ["person-1", "assistant", "assistant"];
  bootstrap.tasks[0].mentorId = "mentor";
  bootstrap.tasks[0].requestedById = "requester";
  bootstrap.risks[0].mitigationTaskId = "two";
  const risk = row(bootstrap.risks[0].id, { source: "risk", ownerMemberId: "owner", affectedTaskIds: ["one", "two", "elsewhere"] });
  const groups = buildHomePressureGroups([risk], "individual", bootstrap, { activePersonFilter: ["person-1"] });
  expect(groups.map(group => group.id).sort()).toEqual(["individual:assistant", "individual:owner", "individual:person-1"]);
  expect(groups.every(group => group.items.length === 1)).toBe(true);
});

test("task subsystem grouping retains unavailable canonical targets discarded by queue area metadata", () => {
  const bootstrap = fixture();
  bootstrap.tasks[0].subsystemIds = ["missing", "missing"];
  bootstrap.tasks[0].mechanismIds = ["lost"];
  bootstrap.tasks[0].partInstanceIds = ["gone"];
  const groups = buildHomePressureGroups([row("one", { areaIds: ["unassigned:project-1"], areaLabels: ["No subsystem"] })], "subsystem", bootstrap);
  expect(groups.map(group => group.label)).toEqual(["Unknown mechanism (lost)", "Unknown part instance (gone)", "Unknown subsystem (missing)"]);
});
