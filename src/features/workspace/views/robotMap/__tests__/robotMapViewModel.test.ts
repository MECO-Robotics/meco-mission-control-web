/// <reference types="jest" />

import { createBootstrap, createPartDefinition, createPartInstance, createSubsystem } from "@/lib/appUtilsTestFixtures";
import { buildRobotConfigurationViewModel } from "../robotMapViewModel";

describe("buildRobotConfigurationViewModel", () => {
  it("returns subsystem mechanism/part counts and normalized layout", () => {
    const bootstrap = createBootstrap({
      subsystems: [createSubsystem({ id: "subsystem-drive", name: "Drivetrain", layoutX: 0.48, layoutY: 0.15, layoutZone: "front", sortOrder: 0 })],
      mechanisms: [{ id: "mechanism-1", subsystemId: "subsystem-drive", name: "Swerve Modules", description: "", iteration: 1 }],
      partInstances: [createPartInstance({ id: "part-instance-1", intendedSubsystemId: "subsystem-drive", intendedMechanismId: "mechanism-1", location: { kind: "installed", subsystemId: "subsystem-drive", mechanismId: "mechanism-1" } })],
    });
    const model = buildRobotConfigurationViewModel(bootstrap);
    expect(model.subsystems[0].layout.layoutZone).toBe("front");
    expect(model.subsystems[0].layout.layoutX).toBeCloseTo(0.48, 4);
    expect(model.subsystems[0].layout.layoutY).toBeCloseTo(0.15, 4);
  });

  it("filters subsystems by search text", () => {
    const bootstrap = createBootstrap({
      subsystems: [
        createSubsystem({ id: "subsystem-a", name: "Shooter", description: "Top assembly", isCore: false }),
        createSubsystem({ id: "subsystem-b", name: "Intake", description: "Front rollers", isCore: false }),
      ],
      mechanisms: [],
      partInstances: [],
    });
    expect(buildRobotConfigurationViewModel(bootstrap, "intake").subsystems[0].name).toBe("Intake");
  });

  it("resolves CAD source indicators from persisted object metadata", () => {
    const bootstrap = createBootstrap({
      subsystems: [createSubsystem({ id: "subsystem-drive", name: "Drivetrain", cadImportSource: "STEP_UPLOAD" })],
      mechanisms: [{ id: "mechanism-1", subsystemId: "subsystem-drive", name: "Swerve Modules", description: "", iteration: 1, cadSource: "ONSHAPE_BOM_CSV" }],
      partDefinitions: [createPartDefinition({ cadSource: "STEP_UPLOAD" })],
      partInstances: [createPartInstance({
        id: "part-instance-1", intendedSubsystemId: "subsystem-drive", intendedMechanismId: "mechanism-1",
        location: { kind: "installed", subsystemId: "subsystem-drive", mechanismId: "mechanism-1" }, cadEditedAfterImport: true,
      })],
    });
    const subsystem = buildRobotConfigurationViewModel(bootstrap).subsystems[0];
    expect(subsystem.cadSource.label).toBe("STEP import");
    expect(subsystem.mechanisms[0].cadSource.label).toBe("Onshape sync");
    expect(subsystem.mechanisms[0].parts[0].cadSource.label).toBe("Edited after import");
  });
});
