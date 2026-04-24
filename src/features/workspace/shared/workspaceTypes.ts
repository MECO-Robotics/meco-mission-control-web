import type { ReactNode } from "react";

import type { BootstrapPayload } from "../../../types";

export type ViewTab =
  | "tasks"
  | "worklogs"
  | "manufacturing"
  | "inventory"
  | "subsystems"
  | "roster";

export type TaskViewTab = "timeline" | "queue";
export type ManufacturingViewTab = "cnc" | "prints" | "fabrication";
export type InventoryViewTab = "materials" | "parts" | "purchases";

export interface NavigationItem {
  value: ViewTab;
  label: string;
  icon: ReactNode;
  count: number;
}

export interface DropdownOption {
  id: string;
  name: string;
}

export type MembersById = Record<string, BootstrapPayload["members"][number]>;
export type SubsystemsById = Record<string, BootstrapPayload["subsystems"][number]>;

export const WORKSPACE_PANEL_CLASS = "workspace-panel";
