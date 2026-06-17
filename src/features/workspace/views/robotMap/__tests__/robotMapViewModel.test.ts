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

  it("resolves CAD source indicators from persisted object metadata", () => {
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
          cadImportSource: "STEP_UPLOAD",
        },
      ],
      mechanisms: [
        {
          id: "mechanism-1",
          subsystemId: "subsystem-drive",
          name: "Swerve Modules",
          description: "",
          iteration: 1,
          cadSource: "ONSHAPE_BOM_CSV",
        },
      ],
      partDefinitions: [
        {
          id: "part-def-1",
          seasonId: "season-2026",
          name: "Wheel Module",
          partNumber: "WM-001",
          revision: "A",
          iteration: 1,
          isHardware: false,
          type: "assembly",
          source: "Onshape",
          materialId: null,
          description: "",
          cadSource: "STEP_UPLOAD",
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
          cadEditedAfterImport: true,
        },
      ],
    });

    const subsystem = buildRobotConfigurationViewModel(bootstrap).subsystems[0];

    expect(subsystem.cadSource.label).toBe("STEP import");
    expect(subsystem.mechanisms[0].cadSource.label).toBe("Onshape sync");
    expect(subsystem.mechanisms[0].parts[0].cadSource.label).toBe("Edited after import");
  });

  it("derives subsystem drilldown links from direct and child records", () => {
    const bootstrap = createBootstrap({
      mechanisms: [
        {
          id: "mechanism-1",
          subsystemId: "subsystem-core",
          name: "Gearbox",
          description: "",
          iteration: 1,
        },
        {
          id: "mechanism-archived",
          subsystemId: "subsystem-core",
          name: "Archived Shooter",
          description: "",
          isArchived: true,
          iteration: 1,
        },
      ],
      partInstances: [
        {
          id: "part-instance-1",
          subsystemId: "subsystem-core",
          mechanismId: "mechanism-1",
          partDefinitionId: "part-def-1",
          name: "Left Bearing Block",
          quantity: 2,
          trackIndividually: false,
          status: "not ready",
        },
        {
          id: "part-instance-direct",
          subsystemId: "subsystem-core",
          mechanismId: null,
          partDefinitionId: "part-def-2",
          name: "Bumper Mount",
          quantity: 1,
          trackIndividually: false,
          status: "not ready",
        },
        {
          id: "part-instance-archived",
          subsystemId: "subsystem-core",
          mechanismId: "mechanism-archived",
          partDefinitionId: "part-def-3",
          name: "Archived Flywheel",
          quantity: 1,
          trackIndividually: false,
          status: "not ready",
        },
      ],
      risks: [
        {
          id: "risk-1",
          title: "Gearbox tolerance",
          detail: "Fit may slip.",
          severity: "high",
          sourceType: "test-result",
          sourceId: "test-1",
          attachmentType: "mechanism",
          attachmentId: "mechanism-1",
          mitigationTaskId: null,
        },
        {
          id: "risk-direct",
          title: "Mount clearance",
          detail: "Frame clearance needs review.",
          severity: "medium",
          sourceType: "test-result",
          sourceId: "test-2",
          attachmentType: "part-instance",
          attachmentId: "part-instance-direct",
          mitigationTaskId: null,
        },
        {
          id: "risk-archived",
          title: "Archived imbalance",
          detail: "Hidden archived mechanism risk.",
          severity: "low",
          sourceType: "test-result",
          sourceId: "test-3",
          attachmentType: "part-instance",
          attachmentId: "part-instance-archived",
          mitigationTaskId: null,
        },
      ],
      tasks: [
        {
          id: "task-1",
          projectId: "project-a",
          workstreamId: "workstream-a",
          workstreamIds: ["workstream-a"],
          title: "Machine gearbox plates",
          summary: "",
          subsystemId: "",
          subsystemIds: [],
          disciplineId: "discipline-design",
          mechanismId: null,
          mechanismIds: ["mechanism-1"],
          partInstanceId: null,
          partInstanceIds: [],
          targetMilestoneId: null,
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "high",
          status: "in-progress",
          dependencyIds: [],
          blockers: [],
          linkedManufacturingIds: ["manufacturing-1"],
          linkedPurchaseIds: [],
          estimatedHours: 3,
          actualHours: 1,
          requiresDocumentation: false,
          documentationLinked: false,
        },
        {
          id: "task-direct",
          projectId: "project-a",
          workstreamId: "workstream-a",
          workstreamIds: ["workstream-a"],
          title: "Wire bumper mounts",
          summary: "",
          subsystemId: "",
          subsystemIds: [],
          disciplineId: "discipline-design",
          mechanismId: null,
          mechanismIds: [],
          partInstanceId: "part-instance-direct",
          partInstanceIds: [],
          targetMilestoneId: null,
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "medium",
          status: "not-started",
          dependencyIds: [],
          blockers: [],
          linkedManufacturingIds: [],
          linkedPurchaseIds: [],
          estimatedHours: 1,
          actualHours: 0,
          requiresDocumentation: false,
          documentationLinked: false,
        },
        {
          id: "task-archived",
          projectId: "project-a",
          workstreamId: "workstream-a",
          workstreamIds: ["workstream-a"],
          title: "Remove archived flywheel",
          summary: "",
          subsystemId: "",
          subsystemIds: [],
          disciplineId: "discipline-design",
          mechanismId: null,
          mechanismIds: [],
          partInstanceId: "part-instance-archived",
          partInstanceIds: [],
          targetMilestoneId: null,
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "low",
          status: "not-started",
          dependencyIds: [],
          blockers: [],
          linkedManufacturingIds: [],
          linkedPurchaseIds: [],
          estimatedHours: 1,
          actualHours: 0,
          requiresDocumentation: false,
          documentationLinked: false,
        },
      ],
      workLogs: [
        {
          id: "worklog-1",
          taskId: "task-1",
          date: "2026-02-02",
          hours: 1.5,
          participantIds: ["student-1"],
          notes: "Cut first plate",
        },
        {
          id: "worklog-direct",
          taskId: "task-direct",
          date: "2026-02-03",
          hours: 0.5,
          participantIds: ["student-1"],
          notes: "Installed direct mount",
        },
        {
          id: "worklog-archived",
          taskId: "task-archived",
          date: "2026-02-03",
          hours: 0.5,
          participantIds: ["student-1"],
          notes: "Handled archived part",
        },
      ],
      manufacturingItems: [
        {
          id: "manufacturing-1",
          title: "Gearbox side plates",
          subsystemId: "",
          requestedById: null,
          process: "cnc",
          dueDate: "2026-02-05",
          material: "Aluminum",
          materialId: null,
          partDefinitionId: "part-def-1",
          partInstanceId: null,
          partInstanceIds: ["part-instance-1"],
          quantity: 2,
          status: "requested",
          mentorReviewed: false,
          inHouse: true,
        },
        {
          id: "manufacturing-direct",
          title: "Mount spacer",
          subsystemId: "",
          requestedById: null,
          process: "cnc",
          dueDate: "2026-02-05",
          material: "Aluminum",
          materialId: null,
          partDefinitionId: "part-def-2",
          partInstanceId: "part-instance-direct",
          partInstanceIds: [],
          quantity: 1,
          status: "requested",
          mentorReviewed: false,
          inHouse: true,
        },
        {
          id: "manufacturing-archived",
          title: "Archived flywheel spacer",
          subsystemId: "",
          requestedById: null,
          process: "cnc",
          dueDate: "2026-02-05",
          material: "Aluminum",
          materialId: null,
          partDefinitionId: "part-def-3",
          partInstanceId: "part-instance-archived",
          partInstanceIds: [],
          quantity: 1,
          status: "requested",
          mentorReviewed: false,
          inHouse: true,
        },
      ],
    });

    const subsystem = buildRobotConfigurationViewModel(bootstrap).subsystems[0];

    expect(subsystem.linkedMechanisms.map((link) => link.label)).toEqual(["Gearbox"]);
    expect(subsystem.linkedParts.map((link) => link.label)).toEqual(["Bumper Mount", "Left Bearing Block"]);
    expect(subsystem.linkedTasks.map((link) => link.label)).toEqual(["Machine gearbox plates", "Wire bumper mounts"]);
    expect(subsystem.linkedRisks.map((link) => link.label)).toEqual(["Gearbox tolerance", "Mount clearance"]);
    expect(subsystem.linkedWorkLogs.map((link) => link.label)).toEqual(["Cut first plate", "Installed direct mount"]);
    expect(subsystem.linkedManufacturingItems.map((link) => link.label)).toEqual([
      "Gearbox side plates",
      "Mount spacer",
    ]);
    expect(subsystem.linkedParts.map((link) => link.label)).not.toContain("Archived Flywheel");
    expect(subsystem.linkedTasks.map((link) => link.label)).not.toContain("Remove archived flywheel");
    expect(subsystem.linkedRisks.map((link) => link.label)).not.toContain("Archived imbalance");
    expect(subsystem.linkedWorkLogs.map((link) => link.label)).not.toContain("Handled archived part");
    expect(subsystem.linkedManufacturingItems.map((link) => link.label)).not.toContain("Archived flywheel spacer");
    expect(buildRobotConfigurationViewModel(bootstrap, "bumper mount").subsystems.map((item) => item.name)).toEqual([
      "Drive",
    ]);
  });
});
