import { DEFAULT_TASK_QUEUE_GROUP_BY, groupTaskQueueSwimlanes } from "../taskQueue/taskQueueSwimlanes";
import { createTask, createTaskQueueBootstrap } from "./taskQueueTestFixtures";

describe("Task Queue swim lanes", () => {
  it("defaults to teams in project/catalog order and preserves sorted task order", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "other", name: "Outreach" });
    bootstrap.workTypes.push({ ...bootstrap.workTypes[0], id: "software", name: "Software", code: "programming" });
    const tasks = [
      createTask(1, { projectId: "other" }),
      createTask(2, { workTypeId: "software" }),
      createTask(3), createTask(4),
    ];
    expect(DEFAULT_TASK_QUEUE_GROUP_BY).toBe("team");
    const projects = groupTaskQueueSwimlanes(tasks, bootstrap);
    expect(projects.map(({ projectName, lanes }) => [
      projectName, lanes.map(({ label, tasks: laneTasks }) => [label.name, laneTasks.map(({ id }) => id)]),
    ])).toEqual([
      ["Robot", [["Design", ["task-3", "task-4"]], ["Software", ["task-2"]]]],
      ["Outreach", [["Design", ["task-1"]]]],
    ]);
    expect(projects.map(({ id }) => id)).toEqual(["project-1", "other"]);
    expect(projects[0].lanes[0].label).toMatchObject({ kind: "team", code: "design" });
    expect(projects[0].lanes[0].label.accentColor).not.toBe(projects[0].lanes[1].label.accentColor);
  });

  it("omits empty groups and keeps unavailable projects or teams visible", () => {
    const bootstrap = createTaskQueueBootstrap();
    expect(groupTaskQueueSwimlanes([], bootstrap)).toEqual([]);
    const [project] = groupTaskQueueSwimlanes([createTask(1, { projectId: "deleted", workTypeId: "" })], bootstrap);
    expect(project.projectName).toBe("Unavailable project");
    expect(project.lanes[0].label.name).toBe("Unassigned team");
    expect(project.lanes[0].tasks).toHaveLength(1);
    expect(groupTaskQueueSwimlanes([createTask(1, { workTypeId: "missing" })], bootstrap)[0].lanes[0].label.name).toBe("Unavailable team");
  });

  it("groups by linked subsystems, deduplicating targets and retaining unassigned tasks", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "arm", name: "Arm", color: "#123456" });
    const tasks = [
      createTask(2, { subsystemIds: ["arm"] }),
      createTask(1, { subsystemIds: ["subsystem-1", "arm", "subsystem-1", ""] }),
      createTask(3, { subsystemIds: [] }),
    ];
    const lanes = groupTaskQueueSwimlanes(tasks, bootstrap, "subsystem")[0].lanes;
    expect(lanes.map(({ label, tasks: records }) => [label.name, records.map(({ id }) => id)])).toEqual([
      ["Drive", ["task-1"]], ["Arm", ["task-2", "task-1"]], ["Unassigned subsystem", ["task-3"]],
    ]);
    expect(lanes[1].label).toMatchObject({ kind: "subsystem", accentColor: "#123456" });
    expect(new Set(lanes.flatMap(({ tasks: records }) => records.map(({ id }) => id))).size).toBe(tasks.length);
    expect(tasks.map(({ id }) => id)).toEqual(["task-2", "task-1", "task-3"]);
  });

  it("keeps missing and foreign-project subsystem references visibly unavailable", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "foreign", projectId: "other", name: "Other project's drive" });
    const lanes = groupTaskQueueSwimlanes([
      createTask(1, { subsystemIds: ["foreign", "deleted"] }),
    ], bootstrap, "subsystem")[0].lanes;
    expect(lanes.map(({ label }) => label.name)).toEqual(["Unavailable subsystem", "Unavailable subsystem"]);
    expect(lanes.map(({ tasks }) => tasks[0].id)).toEqual(["task-1", "task-1"]);
    expect(lanes[0].id).not.toBe(lanes[1].id);
  });

  it("uses workstreams for non-robot projects in subsystem mode", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.projects[0] = { ...bootstrap.projects[0], projectType: "outreach" };
    bootstrap.workstreams = [
      { id: "sponsor", projectId: "project-1", name: "Sponsors", description: "", color: "#335577", isArchived: false },
      { id: "events", projectId: "project-1", name: "Events", description: "", color: "#226644", isArchived: false },
      { id: "foreign", projectId: "other", name: "Foreign events", description: "", color: "#123456", isArchived: false },
    ];
    const lanes = groupTaskQueueSwimlanes([
      createTask(1, { workstreamIds: ["events", "sponsor", "events"] }),
      createTask(2, { workstreamIds: [] }),
      createTask(3, { workstreamIds: ["foreign"] }),
    ], bootstrap, "subsystem")[0].lanes;
    expect(lanes.map(({ label }) => label.name)).toEqual(["Sponsors", "Events", "Unassigned workstream", "Unavailable workstream"]);
    expect(lanes[0].label).toMatchObject({ kind: "workstream", accentColor: "#335577" });
    expect(lanes[0].tasks[0].id).toBe("task-1");
    expect(lanes[1].tasks).toHaveLength(1);
  });

  it("removes empty subsystem lanes after filtering and gives each mode independent lane identities", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.subsystems.push({ ...bootstrap.subsystems[0], id: "unused", name: "Unused" });
    const tasks = [createTask(1)];
    expect(groupTaskQueueSwimlanes(tasks, bootstrap, "subsystem")[0].lanes).toHaveLength(1);
    expect(groupTaskQueueSwimlanes([], bootstrap, "subsystem")).toEqual([]);
    expect(groupTaskQueueSwimlanes(tasks, bootstrap)[0].lanes[0].id).not.toBe(
      groupTaskQueueSwimlanes(tasks, bootstrap, "subsystem")[0].lanes[0].id,
    );
  });
});
