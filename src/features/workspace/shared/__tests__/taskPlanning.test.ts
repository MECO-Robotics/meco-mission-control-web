import { getTaskOpenBlockersForTask, getTaskPlanningState } from "../task/taskPlanning";
import { bootstrap } from "./taskPlanningFixture";
import type { BootstrapPayload } from "@/types/bootstrap";

test("task planning keeps manual blockers separate from dependency waiting state", () => {
  expect(getTaskOpenBlockersForTask("task-b", bootstrap)).toHaveLength(1);
  expect(getTaskPlanningState(bootstrap.tasks[1], bootstrap, new Date("2026-04-20T12:00:00Z"))).toBe(
    "blocked",
  );
});

test("task planning accepts milestone and part-instance qa states as satisfied dependency targets", () => {
  const qaBootstrap = {
    ...bootstrap,
    milestones: [
      {
        ...bootstrap.milestones[0],
        status: "qa" as const,
      },
    ],
    partInstances: [
      {
        ...bootstrap.partInstances[0],
        status: "qa" as const,
      },
    ],
    taskDependencies: bootstrap.taskDependencies.map((dependency) => {
      if (dependency.id === "task-dependency-part") {
        return {
          ...dependency,
          requiredState: "qa",
        };
      }

      if (dependency.id === "task-dependency-milestone") {
        return {
          ...dependency,
          dependencyType: "hard" as const,
          requiredState: "qa",
        };
      }

      return dependency;
    }),
    taskBlockers: [],
  } satisfies BootstrapPayload;

  expect(getTaskPlanningState(qaBootstrap.tasks[1], qaBootstrap, new Date("2026-04-20T12:00:00Z"))).toBe(
    "ready",
  );
});
