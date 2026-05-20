import type { RobotConfigurationSubsystemModel } from "./robotMapViewModel";

interface SubsystemMapCardProps {
  isEditable?: boolean;
  isDragging?: boolean;
  isSelected: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
  subsystem: RobotConfigurationSubsystemModel;
}

export function SubsystemMapCard({
  isEditable = false,
  isDragging = false,
  isSelected,
  onPointerDown,
  onSelect,
  subsystem,
}: SubsystemMapCardProps) {
  return (
    <button
      className={`robot-config-subsystem-card${isEditable ? " is-editable" : ""}${isSelected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
      onClick={onSelect}
      onPointerDown={onPointerDown}
      type="button"
    >
      <strong className="robot-config-subsystem-name">{subsystem.name}</strong>
      <small className="robot-config-subsystem-meta">{`${subsystem.mechanismCount}M | ${subsystem.partCount}P`}</small>
    </button>
  );
}
