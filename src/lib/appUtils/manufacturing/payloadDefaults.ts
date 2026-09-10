import type { BootstrapPayload } from "@/types/bootstrap";
import type { ManufacturingItemPayload } from "@/types/payloads";
import { getDefaultSubsystemId } from "@/lib/appUtils/common";
import { localTodayDate } from "@/lib/dateUtils";
import { inferManufacturingDraftFromPartSelection } from "./draftInference";

export function buildEmptyManufacturingPayload(
  bootstrap: BootstrapPayload,
  process: ManufacturingItemPayload["process"],
  defaultRequesterId: string | null = null,
): ManufacturingItemPayload {
  const firstMaterial = bootstrap.materials[0] ?? null;
  const firstPartDefinition = bootstrap.partDefinitions[0] ?? null;
  const requesterId =
    defaultRequesterId &&
    bootstrap.members.some((member) => member.id === defaultRequesterId)
      ? defaultRequesterId
      : bootstrap.members[0]?.id ?? null;
  const basePayload: ManufacturingItemPayload = {
    title: firstPartDefinition?.name ?? "",
    subsystemId: getDefaultSubsystemId(bootstrap),
    requestedById: requesterId,
    process,
    dueDate: localTodayDate(),
    material: firstMaterial?.name ?? "",
    materialId: firstMaterial?.id ?? null,
    partDefinitionId: firstPartDefinition?.id ?? null,
    partInstanceId: null,
    partInstanceIds: [],
    quantity: 1,
    status: "requested",
    mentorReviewed: false,
    inHouse: process === "cnc",
    batchLabel: "",
  };
  return firstPartDefinition
    ? inferManufacturingDraftFromPartSelection(bootstrap, basePayload, firstPartDefinition.id)
    : basePayload;
}
