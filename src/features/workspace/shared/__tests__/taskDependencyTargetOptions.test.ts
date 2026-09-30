import { getTaskPartInstanceLabel } from "../task/taskTargeting";
import type { PartDefinitionRecord, PartInstanceRecord } from "@/types/recordsInventory";

const instance: PartInstanceRecord = {
  id: "instance-1",
  partDefinitionId: "definition-1",
  intendedSubsystemId: null,
  intendedMechanismId: null,
  location: { kind: "stock", location: "Parts cabinet" },
};

const definition: PartDefinitionRecord = {
  id: "definition-1",
  seasonId: "season-1",
  name: "Clamp body",
  partNumber: "P-1",
  revision: "A",
  iteration: 2,
  type: "part",
  defaultAcquisitionMethod: "stock",
  materialId: null,
  description: "",
};

test("part instance labels derive from its definition and retain the individual instance identity", () => {
  const formatVersion = (value: number | null | undefined) => `v${value ?? "?"}`;

  expect(getTaskPartInstanceLabel(instance, { [definition.id]: definition }, formatVersion)).toBe(
    "Clamp body (v2) · instance-1",
  );
  expect(getTaskPartInstanceLabel(instance, {}, formatVersion)).toBe("Unknown part · instance-1");
});
