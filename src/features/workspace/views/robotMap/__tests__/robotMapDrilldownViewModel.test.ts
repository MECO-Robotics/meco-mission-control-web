/// <reference types="jest" />

import { createBootstrap, createPartDefinition } from "@/lib/appUtilsTestFixtures";
import { buildRobotConfigurationViewModel } from "../robotMapViewModel";

describe("buildRobotConfigurationViewModel drilldowns", () => {
  it("derives subsystem drilldown links from direct and child records", () => {
    const bootstrap = createBootstrap({
      partDefinitions: [
        createPartDefinition({ id: "part-def-1", name: "Left Bearing Block" }),
        createPartDefinition({ id: "part-def-2", name: "Bumper Mount" }),
        createPartDefinition({ id: "part-def-3", name: "Archived Flywheel" }),
      ],
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
          intendedSubsystemId: "subsystem-core",
          intendedMechanismId: "mechanism-1",
          partDefinitionId: "part-def-1",
          location: { kind: "stock", location: "Rack A" },
        },
        {
          id: "part-instance-direct",
          intendedSubsystemId: "subsystem-core",
          intendedMechanismId: null,
          partDefinitionId: "part-def-2",
          location: { kind: "stock", location: "Rack A" },
        },
        {
          id: "part-instance-archived",
          intendedSubsystemId: "subsystem-core",
          intendedMechanismId: "mechanism-archived",
          partDefinitionId: "part-def-3",
          location: { kind: "stock", location: "Rack A" },
        },
      ],
      risks: [
        {
          id: "risk-1",
          title: "Gearbox tolerance",
          detail: "Fit may slip.",
          severity: "high",
          projectId: "project-a", category: "design", status: "open", blocksWork: false,
          source: { kind: "manual" }, relatedTargets: [{ kind: "mechanism", id: "mechanism-1" }],
          mitigationTaskId: null,
          ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null,
        },
        {
          id: "risk-direct",
          title: "Mount clearance",
          detail: "Frame clearance needs review.",
          severity: "medium",
          projectId: "project-a", category: "design", status: "open", blocksWork: false,
          source: { kind: "manual" }, relatedTargets: [{ kind: "part-instance", id: "part-instance-direct" }],
          mitigationTaskId: null,
          ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null,
        },
        {
          id: "risk-archived",
          title: "Archived imbalance",
          detail: "Hidden archived mechanism risk.",
          severity: "low",
          projectId: "project-a", category: "design", status: "open", blocksWork: false,
          source: { kind: "manual" }, relatedTargets: [{ kind: "part-instance", id: "part-instance-archived" }],
          mitigationTaskId: null,
          ownerGroupId: null,
        ownerMemberId: null,
        mitigationDueDate: null, createdAt: "2026-01-01", updatedAt: "2026-01-01", resolvedAt: null,
        },
      ],
      tasks: [
        {
          id: "task-1",
          projectId: "project-a",
          workstreamIds: ["workstream-a"],
          title: "Machine gearbox plates",
          summary: "",
          subsystemIds: [],
          workTypeId: "robot-design",
          responsibleGroupId: null,
          mechanismIds: ["mechanism-1"],
          partInstanceIds: [],
          requestedById: null,
          scheduleRefs: [],
          manufacturingDetails: null,
          checklistItems: [],
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "high",
          status: "in-progress",

          estimatedHours: 3,
          actualHours: 1,
          requiresDocumentation: false,
        },
        {
          id: "task-direct",
          projectId: "project-a",
          workstreamIds: ["workstream-a"],
          title: "Wire bumper mounts",
          summary: "",
          subsystemIds: ["subsystem-core"],
          workTypeId: "robot-design",
          responsibleGroupId: null,
          mechanismIds: [],
          partInstanceIds: [],
          requestedById: null,
          scheduleRefs: [],
          manufacturingDetails: null,
          checklistItems: [],
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "medium",
          status: "not-started",

          estimatedHours: 1,
          actualHours: 0,
          requiresDocumentation: false,
        },
        {
          id: "task-archived",
          projectId: "project-a",
          workstreamIds: ["workstream-a"],
          title: "Remove archived flywheel",
          summary: "",
          subsystemIds: [],
          workTypeId: "robot-design",
          responsibleGroupId: null,
          mechanismIds: [],
          partInstanceIds: [],
          requestedById: null,
          scheduleRefs: [],
          manufacturingDetails: null,
          checklistItems: [],
          ownerId: null,
          assigneeIds: [],
          mentorId: null,
          startDate: "2026-02-01",
          dueDate: "2026-02-10",
          priority: "low",
          status: "not-started",

          estimatedHours: 1,
          actualHours: 0,
          requiresDocumentation: false,
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
    });

    const subsystem = buildRobotConfigurationViewModel(bootstrap).subsystems[0];

    expect(subsystem.linkedMechanisms.map((link) => link.label)).toEqual(["Gearbox"]);
    expect(subsystem.linkedParts.map((link) => link.label)).toEqual(["Bumper Mount", "Left Bearing Block"]);
    expect(subsystem.linkedTasks.map((link) => link.label)).toEqual(["Machine gearbox plates", "Wire bumper mounts"]);
    expect(subsystem.linkedRisks.map((link) => link.label)).toEqual(["Gearbox tolerance", "Mount clearance"]);
    expect(subsystem.riskCount).toBe(subsystem.linkedRisks.length);
    expect(subsystem.linkedWorkLogs.map((link) => link.label)).toEqual(["Cut first plate", "Installed direct mount"]);
    expect(subsystem.linkedParts.map((link) => link.label)).not.toContain("Archived Flywheel");
    expect(subsystem.linkedTasks.map((link) => link.label)).not.toContain("Remove archived flywheel");
    expect(subsystem.linkedRisks.map((link) => link.label)).not.toContain("Archived imbalance");
    expect(subsystem.linkedWorkLogs.map((link) => link.label)).not.toContain("Handled archived part");
    expect(buildRobotConfigurationViewModel(bootstrap, "bumper mount").subsystems.map((item) => item.name)).toEqual([
      "Drive",
    ]);
  });
});
