/// <reference types="jest" />

import { buildEmptyManufacturingPayload, getManufacturingPartInstanceOptions, inferManufacturingDraftFromPartSelection } from "@/lib/appUtils/manufacturing";
import { createBootstrap, createMaterial, createPartDefinition, createPartInstance } from "@/lib/appUtilsTestFixtures";

describe("appUtils manufacturing helpers", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("buildEmptyManufacturingPayload derives material, subsystem, instance, and quantity from the default part", () => {
    const partDefinition = createPartDefinition({
      id: "part-def-bearing-block",
      name: "Bearing Block",
      partNumber: "BB-001",
      revision: "A",
      source: "Onshape",
      materialId: "material-aluminum",
    });
    const bootstrap = createBootstrap({
      materials: [
        createMaterial({
          id: "material-polycarbonate",
          name: "Polycarbonate",
          category: "plastic",
          unit: "sheet",
          onHandQuantity: 1,
        }),
        createMaterial({
          id: "material-aluminum",
          name: "Aluminum 6061",
          unit: "bar",
        }),
      ],
      partDefinitions: [partDefinition],
      partInstances: [
        createPartInstance({
          id: "part-instance-unrelated",
          partDefinitionId: "part-def-other",
          mechanismId: null,
          subsystemId: "subsystem-core",
          name: "Unrelated Part",
          quantity: 2,
        }),
        createPartInstance({
          id: "part-instance-bearing-block",
          partDefinitionId: partDefinition.id,
          mechanismId: null,
          subsystemId: "subsystem-secondary",
          name: "Shooter Bearing Block",
          quantity: 4,
        }),
      ],
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));

    (["cnc", "3d-print", "fabrication"] as const).forEach((process) => {
      const payload = buildEmptyManufacturingPayload(bootstrap, process);

      expect(payload.process).toBe(process);
      expect(payload.dueDate).toBe("2026-01-02");
      expect(payload.title).toBe(partDefinition.name);
      expect(payload.materialId).toBe("material-aluminum");
      expect(payload.material).toBe("Aluminum 6061");
      expect(payload.subsystemId).toBe("subsystem-secondary");
      expect(payload.partDefinitionId).toBe(partDefinition.id);
      expect(payload.partInstanceId).toBe("part-instance-bearing-block");
      expect(payload.partInstanceIds).toEqual(["part-instance-bearing-block"]);
      expect(payload.quantity).toBe(4);
      expect(payload.inHouse).toBe(process === "cnc");
    });
  });

  it("inferManufacturingDraftFromPartSelection updates an existing draft from the selected part", () => {
    const partDefinition = createPartDefinition({
      id: "part-def-bearing-block",
      name: "Bearing Block",
      partNumber: "BB-001",
      revision: "A",
      source: "Onshape",
      materialId: "material-aluminum",
    });
    const bootstrap = createBootstrap({
      materials: [
        createMaterial({
          id: "material-aluminum",
          name: "Aluminum 6061",
          unit: "bar",
        }),
      ],
      partDefinitions: [partDefinition],
      partInstances: [
        createPartInstance({
          id: "part-instance-bearing-block",
          partDefinitionId: partDefinition.id,
          mechanismId: null,
          subsystemId: "subsystem-secondary",
          name: "Shooter Bearing Block",
          quantity: 4,
        }),
      ],
    });

    const payload = inferManufacturingDraftFromPartSelection(
      bootstrap,
      {
        title: "Old print",
        subsystemId: "subsystem-core",
        requestedById: null,
        process: "3d-print",
        dueDate: "2026-02-01",
        material: "PLA",
        materialId: null,
        partDefinitionId: null,
        partInstanceId: null,
        partInstanceIds: [],
        quantity: 1,
        status: "requested",
        mentorReviewed: false,
        inHouse: false,
        batchLabel: "",
      },
      partDefinition.id,
    );

    expect(payload.title).toBe(partDefinition.name);
    expect(payload.materialId).toBe("material-aluminum");
    expect(payload.material).toBe("Aluminum 6061");
    expect(payload.subsystemId).toBe("subsystem-secondary");
    expect(payload.partInstanceId).toBe("part-instance-bearing-block");
    expect(payload.quantity).toBe(4);
  });

  it("inferManufacturingDraftFromPartSelection clears stale material when the selected part has no material", () => {
    const bootstrap = createBootstrap({
      materials: [
        createMaterial({
          id: "material-aluminum",
          name: "Aluminum 6061",
          unit: "bar",
        }),
      ],
    });
    const partDefinition = bootstrap.partDefinitions[0];

    const payload = inferManufacturingDraftFromPartSelection(
      bootstrap,
      {
        ...buildEmptyManufacturingPayload(bootstrap, "cnc"),
        material: "Aluminum 6061",
        materialId: "material-aluminum",
      },
      partDefinition.id,
    );

    expect(payload.materialId).toBeNull();
    expect(payload.material).toBe("");
  });

  it("lists manufacturing part instances for the selected part definition across subsystems", () => {
    const partDefinition = createBootstrap().partDefinitions[0];
    const bootstrap = createBootstrap({
      partInstances: [
        createPartInstance({
          id: "part-instance-core",
          partDefinitionId: partDefinition.id,
          mechanismId: "mechanism-1",
          subsystemId: "subsystem-core",
          name: "Drive Bearing Block",
          quantity: 2,
        }),
        createPartInstance({
          id: "part-instance-secondary",
          partDefinitionId: partDefinition.id,
          mechanismId: null,
          subsystemId: "subsystem-secondary",
          name: "Shooter Bearing Block",
          quantity: 4,
        }),
      ],
    });

    const options = getManufacturingPartInstanceOptions(bootstrap, {
      ...buildEmptyManufacturingPayload(bootstrap, "cnc"),
      subsystemId: "subsystem-core",
      partDefinitionId: partDefinition.id,
    });

    expect(options.map((option) => option.id)).toEqual([
      "part-instance-core",
      "part-instance-secondary",
    ]);
  });
});
