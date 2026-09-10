import type { NavigationSubItemId, ViewAvailabilityContext } from "./types";
export const VIEW_AVAILABILITY_CONTEXTS: readonly ViewAvailabilityContext[] = ["all-project", "robot-project", "non-robot-project", "no-project", "no-season"];
const everywhere = { "all-project": true, "robot-project": true, "non-robot-project": true, "no-project": true, "no-season": true };
const seasonal = { ...everywhere, "no-season": false };
const project = { ...seasonal, "no-project": false };
const robot = { ...project, "all-project": false, "non-robot-project": false };
export const NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX: Record<NavigationSubItemId, Readonly<Record<ViewAvailabilityContext, boolean>>> = {
  home: everywhere,
  "work-tasks": seasonal, "work-schedule": seasonal, "work-risks": seasonal, "work-activity": seasonal,
  "resources-materials": { ...project, "non-robot-project": false },
  "resources-documents": { ...robot, "robot-project": false, "non-robot-project": true },
  "resources-parts": robot, "resources-purchases": project, "resources-manufacturing": robot,
  "resources-structure": { ...project, "all-project": false },
  "team-people": seasonal, "team-attendance": seasonal,
};
