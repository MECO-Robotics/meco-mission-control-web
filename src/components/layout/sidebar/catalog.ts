import type { NavigationSubItem } from "@/lib/workspaceNavigation/types";

const requirements = new Set(["project", "season", "robot-project", "non-robot-project"]);

export function validateSidebarCatalog(value: unknown): readonly NavigationSubItem[] {
  if (!Array.isArray(value)) throw new Error("Sidebar catalog must be an array.");
  for (const item of value) {
    if (!item || typeof item !== "object") throw new Error("Sidebar catalog items must be objects.");
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.label !== "string" || typeof candidate.section !== "string" || typeof candidate.icon !== "string") {
      throw new Error("Sidebar catalog items require id, label, section, and icon strings.");
    }
    if (!candidate.target || typeof candidate.target !== "object") throw new Error(`Sidebar item ${candidate.id} requires a target.`);
    if (candidate.requires !== undefined && (!Array.isArray(candidate.requires) || candidate.requires.some((requirement) => typeof requirement !== "string" || !requirements.has(requirement)))) {
      throw new Error(`Sidebar item ${candidate.id} has an invalid requirement.`);
    }
  }
  return value as readonly NavigationSubItem[];
}
