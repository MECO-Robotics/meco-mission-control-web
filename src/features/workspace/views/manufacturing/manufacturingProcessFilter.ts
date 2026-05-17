import type { ManufacturingProcess } from "@/types/common";
import type { ManufacturingItemRecord } from "@/types/recordsInventory";
import type { DropdownOption } from "@/features/workspace/shared/model/workspaceTypes";
import type { ManufacturingViewTab } from "@/lib/workspaceNavigation";

export const MANUFACTURING_PROCESS_FILTER_OPTIONS: DropdownOption[] = [
  { id: "prints", name: "3D printing" },
  { id: "cnc", name: "CNC" },
  { id: "fabrication", name: "Fab" },
];

const MANUFACTURING_VIEW_PROCESS: Partial<Record<ManufacturingViewTab, ManufacturingProcess>> = {
  cnc: "cnc",
  prints: "3d-print",
  fabrication: "fabrication",
};

export function filterManufacturingItemsByProcessView(
  items: ManufacturingItemRecord[],
  processView: ManufacturingViewTab,
) {
  const process = MANUFACTURING_VIEW_PROCESS[processView];

  if (!process) {
    return items;
  }

  return items.filter((item) => item.process === process);
}
