import type { NavigationSubItem } from "@/lib/workspaceNavigation/types";

export function validateSidebarCatalog(value: unknown): readonly NavigationSubItem[] {
  if (!Array.isArray(value)) throw new Error("Sidebar catalog must be an array.");
  for (const item of value) {
    if (!item || typeof item !== "object") throw new Error("Sidebar catalog items must be objects.");
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.label !== "string" || typeof candidate.section !== "string" || typeof candidate.icon !== "string") {
      throw new Error("Sidebar catalog items require id, label, section, and icon strings.");
    }
    if (!candidate.target || typeof candidate.target !== "object") throw new Error(`Sidebar item ${candidate.id} requires a target.`);
  }
  return value as readonly NavigationSubItem[];
}
