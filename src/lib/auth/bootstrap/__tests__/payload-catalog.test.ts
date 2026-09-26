/// <reference types="jest" />

import type { BootstrapPayload } from "@/types/bootstrap";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { normalizeBootstrapCatalogRecords } from "@/lib/auth/bootstrap/payload-catalog";

describe("normalizeBootstrapCatalogRecords", () => {
  it("preserves distinct part identities, quantities and manufacturing links", () => {
    const source: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      subsystems: [
        {
          id: "subsystem-1",
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
      ],
      mechanisms: [
        {
          id: "mechanism-1",
          subsystemId: "subsystem-1",
          name: "Drive train",
          description: "",
          iteration: 1,
        },
      ],
      partDefinitions: [
        {
          id: "part-definition-1",
          seasonId: "season-1",
          name: "Bracket",
          partNumber: "P-001",
          revision: "A",
          iteration: 1,
          type: "machined",
          source: "in-house",
          materialId: null,
          description: "",
        },
      ],
      partInstances: [
        {
          id: "part-instance-1",
          subsystemId: "subsystem-1",
          mechanismId: "mechanism-1",
          partDefinitionId: "part-definition-1",
          name: "Bracket set A",
          quantity: 2,
          trackIndividually: false,
          status: "ready",
        },
        {
          id: "part-instance-2",
          subsystemId: "subsystem-1",
          mechanismId: "mechanism-1",
          partDefinitionId: "part-definition-1",
          name: "Bracket set B",
          quantity: 3,
          trackIndividually: true,
          status: "blocked",
        },
      ],
      manufacturingItems: [
        {
          id: "manufacturing-1",
          title: "Bracket batch",
          subsystemId: "subsystem-1",
          requestedById: null,
          process: "cnc",
          dueDate: "2026-05-01",
          material: "6061 aluminum",
          materialId: null,
          partDefinitionId: "part-definition-1",
          partInstanceId: "part-instance-2",
          partInstanceIds: ["part-instance-2"],
          quantity: 1,
          status: "requested",
          mentorReviewed: false,
          inHouse: true,
        },
      ],
    };

    const normalized = normalizeBootstrapCatalogRecords(source);

    expect(normalized.partInstances).toEqual(source.partInstances);
    expect(normalized.partInstances.reduce((sum, part) => sum + part.quantity, 0)).toBe(5);
    expect(normalized.manufacturingItems[0].partInstanceId).toBe("part-instance-2");
    expect(normalized.manufacturingItems[0].partInstanceIds).toEqual(["part-instance-2"]);
    expect(source.partInstances.map((part) => part.quantity)).toEqual([2, 3]);
  });

  it("normalizes missing subsystem layout fields to unplaced defaults", () => {
    const source: BootstrapPayload = {
      ...EMPTY_BOOTSTRAP,
      subsystems: [
        {
          id: "subsystem-1",
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
      ],
    };

    const normalized = normalizeBootstrapCatalogRecords(source);

    expect(normalized.subsystems).toHaveLength(1);
    expect(normalized.subsystems[0].layoutZone).toBe("unplaced");
    expect(normalized.subsystems[0].layoutView).toBe("top");
    expect(normalized.subsystems[0].layoutX).toBeNull();
    expect(normalized.subsystems[0].layoutY).toBeNull();
    expect(normalized.subsystems[0].sortOrder).toBeNull();
  });
});
