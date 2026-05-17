/// <reference types="jest" />

import { createBootstrap } from "@/lib/appUtilsTestFixtures";

import { buildRobotConfigurationViewModel } from "../robotMapViewModel";

describe("buildRobotConfigurationViewModel", () => {
  it("returns subsystem mechanism/part counts and normalized layout", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        {
          id: "subsystem-drive",
          projectId: "project-a",
          name: "Drivetrain",
          description: "",
          iteration: 1,
          isCore: true,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
          layoutX: 0.48,
          layoutY: 0.15,
          layoutZone: "front",
          layoutView: "top",
          sortOrder: 0,
        },
      ],
      mechanisms: [
        {
          id: "mechanism-1",
          subsystemId: "subsystem-drive",
          name: "Swerve Modules",
          description: "",
          iteration: 1,
        },
      ],
      partInstances: [
        {
          id: "part-instance-1",
          subsystemId: "subsystem-drive",
          mechanismId: "mechanism-1",
          partDefinitionId: "part-def-1",
          name: "Wheel Module",
          quantity: 4,
          trackIndividually: false,
          status: "not ready",
        },
      ],
    });

    const model = buildRobotConfigurationViewModel(bootstrap);

    expect(model.subsystemCount).toBe(1);
    expect(model.mechanismCount).toBe(1);
    expect(model.partCount).toBe(4);
    expect(model.subsystems[0].layout.layoutZone).toBe("front");
    expect(model.subsystems[0].layout.layoutX).toBeCloseTo(0.48, 4);
    expect(model.subsystems[0].layout.layoutY).toBeCloseTo(0.15, 4);
  });

  it("filters subsystems by search text", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        {
          id: "subsystem-a",
          projectId: "project-a",
          name: "Shooter",
          description: "Top assembly",
          iteration: 1,
          isCore: false,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
          layoutX: null,
          layoutY: null,
          layoutZone: "unplaced",
          layoutView: "top",
          sortOrder: null,
        },
        {
          id: "subsystem-b",
          projectId: "project-a",
          name: "Intake",
          description: "Front rollers",
          iteration: 1,
          isCore: false,
          parentSubsystemId: null,
          responsibleEngineerId: null,
          mentorIds: [],
          risks: [],
          layoutX: null,
          layoutY: null,
          layoutZone: "unplaced",
          layoutView: "top",
          sortOrder: null,
        },
      ],
      mechanisms: [],
      partInstances: [],
    });

    const model = buildRobotConfigurationViewModel(bootstrap, "intake");

    expect(model.subsystemCount).toBe(1);
    expect(model.subsystems[0].name).toBe("Intake");
  });
});
