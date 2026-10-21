import { buildProductTimelineProjects, getProductTimelineInspection, getProductTimelineTaskContext, getProductTimelineTaskSpan } from "../../views/timeline/model/productTimelineModel";
import { createBootstrap, createBootstrapWithDependency } from "./timelineTestFixtures";

const days = ["2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"];

describe("product timeline work coverage", () => {
  it("shows shared work in each valid subsystem while counting each project task once", () => {
    const bootstrap = createBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "intake", name: "Intake" });
    const task = { ...bootstrap.tasks[0], subsystemIds: ["subsystem-1", "intake", "intake"] };
    const projects = buildProductTimelineProjects(bootstrap, [task, task], days, "subsystem");
    expect(projects[0].taskCount).toBe(1);
    expect(projects[0].groups.map((group) => [group.name, group.tasks.length])).toEqual([["Drivebase", 1], ["Intake", 1]]);
  });

  it("groups non-robot work through workstreams and retains project-level work", () => {
    const bootstrap = createBootstrap();
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "media", name: "Media", projectType: "media" });
    bootstrap.workstreams.push({ id: "video", projectId: "media", name: "Video", description: "" });
    const task = { ...bootstrap.tasks[0], id: "video-task", projectId: "media", workstreamIds: ["video"], subsystemIds: ["subsystem-1"] };
    const general = { ...task, id: "general-task", workstreamIds: [], status: "complete" as const };
    const projects = buildProductTimelineProjects(bootstrap, [task, general], days, "subsystem");
    expect(projects[0].groups.map((group) => group.name)).toEqual(["Video", "General"]);
    expect(projects[0].taskCount).toBe(2);
    expect(projects[0].completeCount).toBe(1);
  });

  it("retains unavailable targets and rejects targets from other projects", () => {
    const bootstrap = createBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "foreign", projectId: "other" });
    const task = { ...bootstrap.tasks[0], subsystemIds: ["missing", "foreign"] };
    expect(buildProductTimelineProjects(bootstrap, [task], days, "subsystem")[0].groups[0]).toMatchObject({ name: "General", tasks: [task] });
    expect(getProductTimelineTaskContext(task, bootstrap, "2026-04-01").unavailableTargets).toEqual(["missing", "foreign"]);
    expect(buildProductTimelineProjects(bootstrap, [{ ...task, subsystemIds: ["missing", "subsystem-1"] }], days, "subsystem")[0].groups.map((group) => group.name)).toEqual(["Drivebase"]);
    expect(buildProductTimelineProjects(bootstrap, [{ ...task, projectId: "missing" }], days, "subsystem")[0].name).toBe("Unavailable project");
  });

  it("orders work by start, due date, title and identity", () => {
    const bootstrap = createBootstrap();
    const base = bootstrap.tasks[0];
    const tasks = [
      { ...base, id: "later", startDate: "2026-04-07" },
      { ...base, id: "z", title: "A" }, { ...base, id: "a", title: "A" },
      { ...base, id: "early-due", dueDate: "2026-04-09" },
    ];
    for (const groupBy of ["team", "subsystem"] as const) {
      expect(buildProductTimelineProjects(bootstrap, tasks, days, groupBy)[0].groups[0].tasks.map((task) => task.id)).toEqual(["early-due", "a", "z", "later"]);
    }
  });

  it("preserves bootstrap project and target order when earlier work belongs to a later target", () => {
    const bootstrap = createBootstrap();
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "media", name: "Media", projectType: "media" });
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "intake", name: "Intake" });
    const base = bootstrap.tasks[0];
    const tasks = [
      { ...base, id: "media-task", projectId: "media", subsystemIds: [], startDate: "2026-04-01" },
      { ...base, id: "intake-task", subsystemIds: ["intake"], startDate: "2026-04-02" },
      { ...base, id: "general", subsystemIds: [], startDate: "2026-04-03" }, base,
    ];
    const projects = buildProductTimelineProjects(bootstrap, tasks, days, "subsystem");
    expect(projects.map((project) => project.name)).toEqual([bootstrap.projects[0].name, "Media"]);
    expect(projects[0].groups.map((group) => group.name)).toEqual(["Drivebase", "Intake", "General"]);
  });

  it("counts only tasks overlapping the period inclusively", () => {
    const bootstrap = createBootstrap();
    const base = bootstrap.tasks[0];
    const tasks = [
      { ...base, id: "before", startDate: "2026-03-01", dueDate: "2026-04-05" },
      { ...base, id: "after", startDate: "2026-04-11", dueDate: "2026-04-20" },
      { ...base, id: "start-boundary", startDate: "2026-03-01", dueDate: days[0] },
      { ...base, id: "end-boundary", startDate: days[4], dueDate: "2026-05-01", status: "complete" as const },
    ];
    for (const groupBy of ["team", "subsystem"] as const) {
      expect(buildProductTimelineProjects(bootstrap, tasks, days, groupBy)[0]).toMatchObject({ taskCount: 2, completeCount: 1 });
      expect(buildProductTimelineProjects(bootstrap, tasks, ["2027-01-01"], groupBy)).toEqual([]);
      expect(buildProductTimelineProjects(bootstrap, tasks, [], groupBy)).toEqual([]);
    }
  });

  it("groups shared work once by its explicit team rather than its owner's memberships", () => {
    const bootstrap = createBootstrap();
    const baseTeam = { seasonId: "season-1", projectIds: [], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false };
    bootstrap.responsibleGroups = [
      { ...baseTeam, id: "owner-team", name: "Owner's team", memberIds: ["member-1"] },
      { ...baseTeam, id: "assigned", name: "Assigned team" },
    ];
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "intake", name: "Intake" });
    const task = { ...bootstrap.tasks[0], responsibleGroupId: "assigned", subsystemIds: ["subsystem-1", "intake"], status: "complete" as const };
    const project = buildProductTimelineProjects(bootstrap, [task, task], days, "team")[0];
    expect(project).toMatchObject({ taskCount: 1, completeCount: 1 });
    expect(project.groups).toEqual([{ id: "team:assigned", name: "Assigned team", tasks: [task] }]);
  });

  it("keeps assigned archived and unavailable teams distinct, with unassigned work last", () => {
    const bootstrap = createBootstrap();
    const baseTeam = { seasonId: "season-1", projectIds: [], workTypeIds: [], memberIds: [], primaryMemberIds: [], isArchived: false };
    bootstrap.responsibleGroups = [
      { ...baseTeam, id: "unassigned-team", name: "Archived team", isArchived: true },
      { ...baseTeam, id: "second", name: "Second team" },
      { ...baseTeam, id: "unused", name: "Unused team" },
    ];
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "media", name: "Media", projectType: "media" });
    const base = bootstrap.tasks[0];
    const tasks = [
      { ...base, id: "media", projectId: "media", responsibleGroupId: "second", startDate: "2026-04-01" },
      { ...base, id: "unassigned", responsibleGroupId: null, startDate: "2026-04-02" },
      { ...base, id: "missing", responsibleGroupId: "missing", startDate: "2026-04-03" },
      { ...base, id: "second", responsibleGroupId: "second", startDate: "2026-04-04" },
      { ...base, id: "archived", responsibleGroupId: "unassigned-team", status: "complete" as const },
    ];
    const projects = buildProductTimelineProjects(bootstrap, tasks, days, "team");
    expect(projects.map((project) => project.id)).toEqual([base.projectId, "media"]);
    expect(projects[0]).toMatchObject({ taskCount: 4, completeCount: 1 });
    expect(projects[0].groups.map((group) => [group.id, group.name, group.tasks.map((task) => task.id)])).toEqual([
      ["team:unassigned-team", "Archived team", ["archived"]],
      ["team:second", "Second team", ["second"]],
      ["team:missing", "Unavailable team (missing)", ["missing"]],
      ["unassigned-team", "Unassigned team", ["unassigned"]],
    ]);
    expect(projects[1].groups.map((group) => group.name)).toEqual(["Second team"]);
  });
});

describe("product timeline date and handoff context", () => {
  it("clips inclusive task bars to the selected days without altering dates", () => {
    const task = createBootstrap().tasks[0];
    expect(getProductTimelineTaskSpan(task, ["2026-04-08", "2026-04-09"])).toEqual({ start: 0, span: 2, spillsLeft: true, spillsRight: true });
    expect(getProductTimelineTaskSpan(task, ["2026-04-10", "2026-04-11"])).toEqual({ start: 0, span: 1, spillsLeft: true, spillsRight: false });
    expect(getProductTimelineTaskSpan(task, ["2026-05-01"])).toBeNull();
    expect(getProductTimelineTaskSpan(task, [])).toBeNull();
    expect(getProductTimelineTaskSpan({ ...task, startDate: "" }, ["2026-04-10"])).toBeNull();
    expect(task.startDate).toBe("2026-04-06");
  });

  it("uses complete bootstrap context for hidden incoming and downstream work", () => {
    const bootstrap = createBootstrapWithDependency();
    const upstream = bootstrap.tasks[0];
    const downstream = bootstrap.tasks[1];
    expect(getProductTimelineInspection(upstream, bootstrap).downstream[0]).toMatchObject({ label: downstream.title, task: downstream, state: "Hard prerequisite" });
    expect(getProductTimelineInspection(downstream, bootstrap).incoming[0]).toMatchObject({ label: upstream.title, task: upstream, state: "Waiting" });
    bootstrap.tasks[0] = { ...upstream, status: "complete" };
    expect(getProductTimelineInspection(downstream, bootstrap).incoming[0].state).toBe("Satisfied");
  });

  it("keeps missing hard prerequisites waiting and soft references advisory", () => {
    const bootstrap = createBootstrapWithDependency();
    const task = bootstrap.tasks[1];
    bootstrap.tasks = [task];
    bootstrap.taskDependencies.push({ ...bootstrap.taskDependencies[0], id: "soft", dependencyType: "soft" });
    const inspection = getProductTimelineInspection(task, bootstrap);
    expect(inspection.incoming.map((item) => [item.label, item.state])).toEqual([["Unknown task", "Waiting"], ["Unknown task", "Advisory"]]);
    expect(getProductTimelineTaskContext(task, bootstrap, "2026-05-01")).toMatchObject({ state: "Not started", waiting: true, overdue: true });
    expect(getProductTimelineTaskContext({ ...task, status: "complete", isBlocked: true }, bootstrap, "2026-05-01")).toMatchObject({ state: "Complete", waiting: false, overdue: false, blocked: false });
    bootstrap.taskDependencies = bootstrap.taskDependencies.filter((dependency) => dependency.dependencyType === "soft");
    expect(getProductTimelineTaskContext(task, bootstrap, "2026-04-01").waiting).toBe(false);
  });

});
