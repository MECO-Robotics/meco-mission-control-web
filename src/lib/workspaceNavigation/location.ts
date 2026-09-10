import { getActiveNavigationSubItemId, getNavigationTarget, isNavigationSubItemAvailable, isNavigationSubItemId } from "./helpers";
import type { NavigationState, NavigationTarget, ViewAvailabilityContext } from "./types";

export function readNavigationLocation(search: string, context: ViewAvailabilityContext): NavigationTarget {
  const params = new URLSearchParams(search);
  if (params.get("utility") === "help") return { tab: "help" };
  const id = params.get("view");
  if (!id || !isNavigationSubItemId(id) || !isNavigationSubItemAvailable(id, { context })) return { tab: "home" };
  const target = getNavigationTarget(id, context);
  const mode = params.get("mode");
  if (id === "work-schedule" && params.get("milestone")) return { ...target, taskView: "milestones", milestoneId: params.get("milestone")! };
  if (id === "work-schedule" && (mode === "timeline" || mode === "milestones")) return { ...target, taskView: mode };
  if (id === "work-activity" && (mode === "activity" || mode === "qa" || mode === "results")) return { ...target, worklogsView: mode };
  if (id === "resources-structure" && mode === "cad" && context === "robot-project") return { tab: "cad" };
  return target;
}

export function writeNavigationLocation(state: NavigationState, context: ViewAvailabilityContext, search: string): string {
  const params = new URLSearchParams(search);
  const id = getActiveNavigationSubItemId(state, context);
  params.set("view", id ?? "home");
  if (id !== "work-schedule") params.delete("milestone");
  params.delete("mode");
  params.delete("utility");
  if (state.activeTab === "help") params.set("utility", "help");
  if (id === "work-schedule" && state.taskView !== "calendar") params.set("mode", state.taskView);
  if (id === "work-activity" && state.activeTab === "worklogs" && state.worklogsView !== "logs") params.set("mode", state.worklogsView);
  if (id === "resources-structure" && state.activeTab === "cad") params.set("mode", "cad");
  return `?${params.toString()}`;
}
