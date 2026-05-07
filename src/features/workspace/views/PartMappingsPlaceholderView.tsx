import type { BootstrapPayload } from "@/types/bootstrap";
import { PartMappingsView } from "@/features/workspace/views/partMappings/PartMappingsView";

interface PartMappingsPlaceholderViewProps {
  bootstrap: BootstrapPayload;
  openCreatePartDefinitionModal: () => void;
  openCreatePartInstanceModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditMechanismModal: (mechanism: BootstrapPayload["mechanisms"][number]) => void;
  openEditPartDefinitionModal: (item: BootstrapPayload["partDefinitions"][number]) => void;
}

export function PartMappingsPlaceholderView(props: PartMappingsPlaceholderViewProps) {
  return <PartMappingsView {...props} />;
}
