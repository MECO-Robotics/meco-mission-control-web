import type { ReactNode } from "react";

import { IconEdit, IconTasks } from "../../../components/shared/Icons";
import type {
  ManufacturingItemRecord,
  PurchaseItemRecord,
} from "../../../types";
import type { DropdownOption, MembersById, SubsystemsById } from "./workspaceTypes";

export function TableCell({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName?: string;
  children: ReactNode;
}) {
  return (
    <span className="table-cell" data-label={label}>
      <span className={`table-cell-value${valueClassName ? ` ${valueClassName}` : ""}`}>
        {children}
      </span>
    </span>
  );
}

export function FilterDropdown({
  allLabel,
  ariaLabel,
  icon,
  onChange,
  options,
  value,
}: {
  allLabel: string;
  ariaLabel?: string;
  icon: ReactNode;
  onChange: (value: string) => void;
  options: DropdownOption[];
  value: string;
}) {
  const isActive = value !== "all";
  const selectedLabel =
    value === "all"
      ? allLabel
      : options.find((option) => option.id === value)?.name ?? allLabel;

  return (
    <label className={`toolbar-filter toolbar-filter-dropdown${isActive ? " is-active" : ""}`}>
      <span className="toolbar-filter-icon">{icon}</span>
      <span aria-hidden="true" className="toolbar-filter-value">
        {selectedLabel}
      </span>
      <span aria-hidden="true" className="toolbar-filter-chevron" />
      <select
        aria-label={ariaLabel ?? allLabel}
        className="toolbar-filter-select toolbar-filter-select-overlay"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">{allLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SearchToolbarInput({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: {
  ariaLabel?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const isActive = value.trim() !== "";

  return (
    <div className={`toolbar-filter toolbar-filter-compact toolbar-search${isActive ? " is-active" : ""}`}>
      <span className="toolbar-filter-icon">
        <IconTasks />
      </span>
      <input
        aria-label={ariaLabel ?? placeholder}
        className="toolbar-search-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </div>
  );
}

export function EditableHoverIndicator({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`editable-hover-indicator${className ? ` ${className}` : ""}`}
    >
      <IconEdit />
    </span>
  );
}

export function RequestedItemMeta({
  item,
  membersById,
  subsystemsById,
}: {
  item: PurchaseItemRecord | ManufacturingItemRecord;
  membersById: MembersById;
  subsystemsById: SubsystemsById;
}) {
  return (
    <div className="requested-item-meta">
      <strong className="requested-item-title">{item.title}</strong>
      <small className="requested-item-subtitle">
        {(item.subsystemId ? subsystemsById[item.subsystemId]?.name : null) ?? "Unknown subsystem"} /{" "}
        {(item.requestedById ? membersById[item.requestedById]?.name : null) ?? "Unassigned"}
      </small>
    </div>
  );
}
