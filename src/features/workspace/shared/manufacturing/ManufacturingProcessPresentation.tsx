import { Cog, Hammer, Printer } from "lucide-react";
import type { ManufacturingProcess } from "@/types/common";

const PROCESS_PRESENTATION: Record<
  ManufacturingProcess,
  { Icon: typeof Printer; label: string }
> = {
  "3d-print": { Icon: Printer, label: "3D printing" },
  cnc: { Icon: Cog, label: "CNC machining" },
  fabrication: { Icon: Hammer, label: "Fabrication" },
};

export function getManufacturingProcessLabel(process: ManufacturingProcess) {
  return PROCESS_PRESENTATION[process].label;
}

export function ManufacturingProcessIcon({
  process,
}: {
  process: ManufacturingProcess;
}) {
  const { Icon, label } = PROCESS_PRESENTATION[process];

  return (
    <span
      aria-label={`${label} manufacturing method`}
      className={`task-queue-board-card-type-icon manufacturing-process-icon manufacturing-process-icon-${process}`}
      role="img"
      title={label}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2.2} />
    </span>
  );
}
