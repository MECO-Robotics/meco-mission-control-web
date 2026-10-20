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

    const lanes = groupTaskQueueSwimlanes(tasks, bootstrap);
    expect(lanes.map(({ projectName, disciplineName, tasks: laneTasks }) => [
      projectName, disciplineName, laneTasks.map(({ id }) => id),
    ])).toEqual([
      ["Robot", "Design", ["task-3", "task-4"]],
      ["Robot", "Software", ["task-2"]],
      ["Outreach", "Design", ["task-1"]],
    ]);
    expect(new Set(lanes.map(({ id }) => id)).size).toBe(3);
  });

  it("omits empty groups after filtering and keeps unavailable references visible", () => {
    const bootstrap = createTaskQueueBootstrap();
    expect(groupTaskQueueSwimlanes([], bootstrap)).toEqual([]);
    const [lane] = groupTaskQueueSwimlanes([
      createTask(1, { projectId: "deleted", workTypeId: "" }),
    ], bootstrap);
    expect(lane.projectName).toBe("Unavailable project");
    expect(lane.disciplineName).toBe("Unassigned discipline");
    expect(lane.tasks).toHaveLength(1);
  });
});
