import type { BootstrapPayload } from "@/types/bootstrap";
import type { PartDefinitionRecord } from "@/types/recordsInventory";

export interface PartsViewProps {
  bootstrap: BootstrapPayload;
  openCreatePartInstanceModal?: (mechanism: BootstrapPayload["mechanisms"][number], partDefinitionId?: string) => void;
  openEditPartInstanceModal?: (instance: BootstrapPayload["partInstances"][number]) => void;
  openCreatePartDefinitionModal: () => void;
  openEditPartDefinitionModal: (item: PartDefinitionRecord) => void;
  mechanismsById: Record<string, BootstrapPayload["mechanisms"][number]>;
  partDefinitionsById: Record<string, BootstrapPayload["partDefinitions"][number]>;
  subsystemsById: Record<string, BootstrapPayload["subsystems"][number]>;
}

export const PART_DEFINITION_GRID_TEMPLATE = "minmax(220px, 2.3fr) 1fr 0.6fr 0.7fr 0.8fr 1fr";
export const PART_INSTANCE_GRID_TEMPLATE = "minmax(220px, 2.3fr) 1fr 1fr 1fr 0.5fr 0.8fr";
