import { groupTaskQueueSwimlanes } from "../taskQueue/taskQueueSwimlanes";
import { createTask, createTaskQueueBootstrap } from "./taskQueueTestFixtures";

describe("Task Queue swim lanes", () => {
  it("groups projects then disciplines in catalog order and preserves sorted task order", () => {
    const bootstrap = createTaskQueueBootstrap();
    bootstrap.projects.push({ ...bootstrap.projects[0], id: "other", name: "Outreach" });
    bootstrap.workTypes.push({ ...bootstrap.workTypes[0], id: "software", name: "Software" });
    const tasks = [
      createTask(1, { projectId: "other" }),
      createTask(2, { workTypeId: "software" }),
      createTask(3),
      createTask(4),
    ];

    const projects = groupTaskQueueSwimlanes(tasks, bootstrap);
    expect(projects.map(({ projectName, lanes }) => [
      projectName, lanes.map(({ disciplineName, tasks: laneTasks }) => [
        disciplineName, laneTasks.map(({ id }) => id),
      ]),
    ])).toEqual([
      ["Robot", [["Design", ["task-3", "task-4"]], ["Software", ["task-2"]]]],
      ["Outreach", [["Design", ["task-1"]]]],
    ]);
    expect(projects.map(({ id }) => id)).toEqual(["project-1", "other"]);
  });

  it("omits empty groups after filtering and keeps unavailable references visible", () => {
    const bootstrap = createTaskQueueBootstrap();
    expect(groupTaskQueueSwimlanes([], bootstrap)).toEqual([]);
    const [lane] = groupTaskQueueSwimlanes([
      createTask(1, { projectId: "deleted", workTypeId: "" }),
    ], bootstrap);
    expect(lane.projectName).toBe("Unavailable project");
    expect(lane.lanes[0].disciplineName).toBe("Unassigned discipline");
    expect(lane.lanes[0].tasks).toHaveLength(1);
  });
});
