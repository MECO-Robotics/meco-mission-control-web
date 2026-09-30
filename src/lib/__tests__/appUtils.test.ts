/// <reference types="jest" />

import { buildEmptyTaskPayload, taskToPayload } from "@/lib/appUtils/taskTargets";
import { getDefaultSubsystemId, getPartDefinitionActiveSeasonIds, isPartDefinitionActiveInSeason, joinList, splitList } from "@/lib/appUtils/common";
import { buildEmptySubsystemPayload } from "@/lib/appUtils/payloadBuilders";
import { formatLocalDate, localTodayDate } from "@/lib/dateUtils";
import { createBootstrap, createSubsystem } from "@/lib/appUtilsTestFixtures";

describe("appUtils", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("splitList trims values and removes empty entries", () => {
    expect(splitList(" alpha, , beta ,gamma ,, ")).toEqual(["alpha", "beta", "gamma"]);
  });

  it("joinList returns a comma-separated label", () => {
    expect(joinList(["alpha", "beta", "gamma"])).toBe("alpha, beta, gamma");
  });

  it("getDefaultSubsystemId prefers the core subsystem", () => {
    const bootstrap = createBootstrap();
    expect(getDefaultSubsystemId(bootstrap)).toBe("subsystem-core");
  });

  it("getDefaultSubsystemId falls back to first subsystem when no core exists", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        createSubsystem({
          id: "subsystem-a",
          projectId: "project-a",
          name: "Subsystem A",
          isCore: false,
        }),
      ],
    });

    expect(getDefaultSubsystemId(bootstrap)).toBe("subsystem-a");
  });

  it("reads part definition active season membership like roster entities", () => {
    const activeSeasonIds = getPartDefinitionActiveSeasonIds({
      seasonId: "season-2026",
      activeSeasonIds: ["season-2027"],
    });

    expect(activeSeasonIds.sort()).toEqual(["season-2026", "season-2027"].sort());
    expect(
      isPartDefinitionActiveInSeason(
        {
          seasonId: "season-2026",
          activeSeasonIds: ["season-2027"],
        },
        "season-2027",
      ),
    ).toBe(true);
    expect(
      isPartDefinitionActiveInSeason(
        {
          seasonId: "season-2026",
          activeSeasonIds: ["season-2027"],
        },
        "season-2028",
      ),
    ).toBe(false);
  });

  it("buildEmptyTaskPayload picks sensible defaults from bootstrap data", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));
    const payload = buildEmptyTaskPayload(createBootstrap());

    expect(payload.projectId).toBe("project-a");
    expect(payload.workstreamIds).toEqual([]);
    expect(payload.subsystemIds).toEqual(["subsystem-core"]);
    expect(payload.mechanismIds).toEqual([]);
    expect(payload.partInstanceIds).toEqual([]);
    expect(payload.ownerId).toBe("lead-1");
    expect(payload.assigneeIds).toEqual(["lead-1"]);
    expect(payload.mentorId).toBe("mentor-1");
    expect(payload.scheduleRefs).toEqual([]);
    expect(payload.startDate).toBe("2026-01-02");
    expect(payload.dueDate).toBe("2026-01-02");
    expect(payload.priority).toBe("medium");
    expect(payload.status).toBe("not-started");
  });

  it("buildEmptySubsystemPayload defaults new subsystems to unplaced layout", () => {
    const payload = buildEmptySubsystemPayload(createBootstrap());

    expect(payload.layoutZone).toBe("unplaced");
    expect(payload.layoutView).toBe("top");
    expect(payload.layoutX).toBeNull();
    expect(payload.layoutY).toBeNull();
    expect(payload.sortOrder).toBeNull();
  });

  it("formats local date-only values without UTC conversion", () => {
    const localDate = new Date(2026, 0, 2, 23, 30);

    expect(formatLocalDate(localDate)).toBe("2026-01-02");
    expect(localTodayDate(localDate)).toBe("2026-01-02");
  });

  it("taskToPayload carries structured dependency records from bootstrap data", () => {
    const bootstrap = createBootstrap({
      taskDependencies: [
        {
          id: "task-dependency-1",
          taskId: "task-1",
          kind: "task",
          refId: "task-upstream",
          requiredState: "complete",
          dependencyType: "hard",
          createdAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    });

    expect(taskToPayload(bootstrap.tasks[0], bootstrap).taskDependencies).toEqual([
      {
        id: "task-dependency-1",
        kind: "task",
        refId: "task-upstream",
        requiredState: "complete",
        dependencyType: "hard",
      },
    ]);
  });

  it("taskToPayload keeps procurement and risk ownership outside Task", () => {
    const bootstrap = createBootstrap();
    const payload = taskToPayload(bootstrap.tasks[0], bootstrap);

    expect(payload).not.toHaveProperty("purchaseItems");
    expect(payload).not.toHaveProperty("risks");
    expect(payload).not.toHaveProperty("blockers");
  });
});
