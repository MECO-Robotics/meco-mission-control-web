import type { DropdownOption } from "./workspaceTypes";

export const TASK_STATUS_OPTIONS: DropdownOption[] = [
  { id: "not-started", name: "Not started" },
  { id: "in-progress", name: "In progress" },
  { id: "waiting-for-qa", name: "Waiting for QA" },
  { id: "complete", name: "Complete" },
];

export const TASK_PRIORITY_OPTIONS: DropdownOption[] = [
  { id: "critical", name: "Critical" },
  { id: "high", name: "High" },
  { id: "medium", name: "Medium" },
  { id: "low", name: "Low" },
];

export const PURCHASE_STATUS_OPTIONS: DropdownOption[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "purchased", name: "Purchased" },
  { id: "shipped", name: "Shipped" },
  { id: "delivered", name: "Delivered" },
];

export const PURCHASE_APPROVAL_OPTIONS: DropdownOption[] = [
  { id: "approved", name: "Approved" },
  { id: "waiting", name: "Waiting" },
];

export const MANUFACTURING_STATUS_OPTIONS: DropdownOption[] = [
  { id: "requested", name: "Requested" },
  { id: "approved", name: "Approved" },
  { id: "in-progress", name: "In progress" },
  { id: "qa", name: "QA" },
  { id: "complete", name: "Complete" },
];

export const MATERIAL_CATEGORY_OPTIONS: DropdownOption[] = [
  { id: "metal", name: "Metal" },
  { id: "plastic", name: "Plastic" },
  { id: "filament", name: "Filament" },
  { id: "electronics", name: "Electronics" },
  { id: "hardware", name: "Hardware" },
  { id: "consumable", name: "Consumable" },
  { id: "other", name: "Other" },
];

export const MATERIAL_STOCK_OPTIONS: DropdownOption[] = [
  { id: "ok", name: "Stock OK" },
  { id: "low", name: "Low stock" },
];

export const PART_STATUS_OPTIONS: DropdownOption[] = [
  { id: "planned", name: "Planned" },
  { id: "needed", name: "Needed" },
  { id: "available", name: "Available" },
  { id: "installed", name: "Installed" },
  { id: "retired", name: "Retired" },
];
