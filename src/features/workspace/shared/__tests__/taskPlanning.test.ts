import { getTaskOpenBlockersForTask, getTaskPlanningState } from "../task/taskPlanning";
import { isTaskDependencySatisfied } from "../task/taskPlanningInternals";
import { bootstrap } from "./taskPlanningFixture";

test("blocking unresolved Risks feed Kanban triage without a Task blocker store", () => {
  expect(getTaskOpenBlockersForTask("task-b", bootstrap)).toHaveLength(1);
  expect(getTaskPlanningState(bootstrap.tasks[1], bootstrap, new Date("2026-04-20T12:00:00Z"))).toBe("blocked");
});

test("PartInstance dependency conditions evaluate physical location separately from readiness", () => {
  const physicalLocation = {
    id: "location-condition",
    taskId: "task-b",
    kind: "part-instance" as const,
    refId: "part-instance-1",
    requiredCondition: { kind: "physical-location" as const, value: "stock" as const },
    dependencyType: "hard" as const,
    createdAt: "2026-04-20T00:00:00.000Z",
  };
  const readiness = {
    ...physicalLocation,
    id: "readiness-condition",
    requiredCondition: { kind: "derived-readiness" as const, value: "ready" as const },
  };

  expect(isTaskDependencySatisfied(physicalLocation, bootstrap)).toBe(true);
  expect(isTaskDependencySatisfied(readiness, bootstrap)).toBe(true);
  expect(isTaskDependencySatisfied({ ...readiness, requiredCondition: { kind: "physical-location", value: "installed" } }, bootstrap)).toBe(false);
});
