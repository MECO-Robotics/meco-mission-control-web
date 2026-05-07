import type { ReactNode } from "react";

import type { BootstrapPayload } from "@/types/bootstrap";

export interface DropdownOption {
  id: string;
  name: string;
  icon?: ReactNode;
}

export type MembersById = Record<string, BootstrapPayload["members"][number]>;
export type SubsystemsById = Record<string, BootstrapPayload["subsystems"][number]>;

export const WORKSPACE_PANEL_CLASS = "workspace-panel";
