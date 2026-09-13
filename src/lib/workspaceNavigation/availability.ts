import { NAVIGATION_SUB_ITEMS } from "./constants";
import type { NavigationSubItemId, ViewAvailabilityContext } from "./types";
export const VIEW_AVAILABILITY_CONTEXTS: readonly ViewAvailabilityContext[] = ["all-project", "robot-project", "non-robot-project", "no-project", "no-season"];

export function isRequirementSatisfied(requirement: string, context: ViewAvailabilityContext): boolean {
  return requirement === "season" ? context !== "no-season"
    : requirement === "project" ? context !== "no-project" && context !== "no-season"
      : requirement === context;
}

export function isCatalogItemAvailable(item: { requires?: readonly string[] }, context: ViewAvailabilityContext): boolean {
  return item.requires?.every((requirement) => isRequirementSatisfied(requirement, context)) ?? true;
}

export function isCatalogNavigationSubItemAvailable(subItemId: NavigationSubItemId, context: ViewAvailabilityContext): boolean {
  const item = NAVIGATION_SUB_ITEMS.find((candidate) => candidate.id === subItemId);
  return item ? isCatalogItemAvailable(item, context) : false;
}
