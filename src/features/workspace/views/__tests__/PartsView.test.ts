/// <reference types="jest" />

import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { filterPartDefinitions } from "@/features/workspace/views/PartsView";
import type { BootstrapPayload } from "@/types/bootstrap";

const bootstrap: BootstrapPayload = {
  ...EMPTY_BOOTSTRAP,
  materials: [
    {
      id: "material-aluminum",
      name: "Aluminum tube",
      category: "metal",
      unit: "ft",
      onHandQuantity: 12,
      reorderPoint: 4,
      location: "Rack",
      vendor: "Local Metals",
      notes: "",
    },
  ],
  subsystems: [
    {
      id: "drive",
      projectId: "project-1",
      name: "Drive",
      description: "",
      iteration: 1,
      isCore: true,
      parentSubsystemId: null,
      responsibleEngineerId: null,
      mentorIds: [],
      risks: [],
    },
    {
      id: "arm",
      projectId: "project-1",
      name: "Arm",
      description: "",
      iteration: 1,
      isCore: true,
      parentSubsystemId: null,
      responsibleEngineerId: null,
      mentorIds: [],
      risks: [],
    },
  ],
  partDefinitions: [
    {
      id: "drive-part",
      seasonId: "season-2026",
      name: "Drive rail",
      partNumber: "DRV-001",
      revision: "A",
      iteration: 1,
      type: "machined",
      source: "in-house",
      materialId: "material-aluminum",
      description: "",
    },
    {
      id: "arm-part",
      seasonId: "season-2026",
      name: "Arm bracket",
      partNumber: "ARM-001",
      revision: "A",
      iteration: 1,
      type: "printed",
      source: "in-house",
      materialId: null,
      description: "",
    },
  ],
  partInstances: [
    {
      id: "drive-installed",
      subsystemId: "drive",
      mechanismId: null,
      partDefinitionId: "drive-part",
      name: "Left drive rail",
      quantity: 1,
      trackIndividually: true,
      status: "ready",
    },
    {
      id: "arm-needed",
      subsystemId: "arm",
      mechanismId: null,
      partDefinitionId: "arm-part",
      name: "Shoulder bracket",
      quantity: 1,
      trackIndividually: true,
      status: "blocked",
    },
  ],
};

describe("PartsView filters", () => {
  it("filters part definitions by linked instance subsystem and status", () => {
    const filteredDefinitions = filterPartDefinitions({
      bootstrap,
      partSearch: "",
      partStatus: ["ready"],
      partSubsystem: ["drive"],
    });

    expect(filteredDefinitions.map((partDefinition) => partDefinition.id)).toEqual(["drive-part"]);
  });

  it("does not keep definitions visible when their linked instances miss active filters", () => {
    const filteredDefinitions = filterPartDefinitions({
      bootstrap,
      partSearch: "",
      partStatus: ["ready"],
      partSubsystem: ["arm"],
    });

    expect(filteredDefinitions).toEqual([]);
  });
});
