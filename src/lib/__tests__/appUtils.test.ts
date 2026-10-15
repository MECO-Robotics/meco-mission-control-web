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

  it.each([
    ["mentor-only roster", [{ id: "mentor-1", role: "mentor" }], null, "mentor-1"],
    ["external-only roster", [{ id: "external-1", role: "external" }], null, null],
    ["empty roster", [], null, null],
  ])("does not assign ineligible fallback owners for a %s", (_label, members, expectedOwner, expectedMentor) => {
    const bootstrap = createBootstrap();
    bootstrap.members = members.map((member) => ({
      id: member.id,
      name: member.id,
      email: `${member.id}@meco.test`,
      role: member.role,
      elevated: false,
      seasonId: "season-2026",
    })) as typeof bootstrap.members;

    const payload = buildEmptyTaskPayload(bootstrap);
    expect(payload.ownerId).toBe(expectedOwner);
    expect(payload.assigneeIds).toEqual([]);
    expect(payload.mentorId).toBe(expectedMentor);
  });

  it("retains collapsed manufacturing fields when an existing task enters edit", () => {
    const bootstrap = createBootstrap();
    const manufacturingDetails = {
      part: { kind: "provisional" as const, partNumber: "FRC-42", revision: "B" },
      quantity: 3,
      processId: "process-lathe",
      fulfillmentSource: "outsourced" as const,
      material: { kind: "specified-material" as const, name: "7075 aluminum" },
      fileArtifactIds: ["drawing-1"],
      tolerances: ["0.2 mm"],
      qaRequirements: ["Measure bore"],
    };
    const task = { ...bootstrap.tasks[0], manufacturingDetails, requiresDocumentation: true };

    expect(taskToPayload(task, bootstrap)).toMatchObject({ manufacturingDetails, requiresDocumentation: true });
  });

  it("uses the selected project for a new task and keeps its area within that project", () => {
    const bootstrap = createBootstrap();
    const payload = buildEmptyTaskPayload(bootstrap, "project-b");

    expect(payload.projectId).toBe("project-b");
    expect(payload.workTypeId).toBe("outreach:planning");
    expect(payload.subsystemIds).toEqual([]);

    const robotBootstrap = createBootstrap({
      projects: bootstrap.projects.map((project) => project.id === "project-b" ? { ...project, projectType: "robot" } : project),
      subsystems: [...bootstrap.subsystems, createSubsystem({ id: "subsystem-b-core", projectId: "project-b", isCore: true })],
    });
    expect(buildEmptyTaskPayload(robotBootstrap, "project-b").subsystemIds).toEqual(["subsystem-b-core"]);
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
