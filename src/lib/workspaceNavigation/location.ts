import { getActiveNavigationSubItemId, getNavigationTarget, isNavigationSubItemAvailable, isNavigationSubItemId } from "./helpers";
import type { NavigationState, NavigationTarget, ViewAvailabilityContext } from "./types";

export function readNavigationLocation(search: string, context: ViewAvailabilityContext): NavigationTarget {
  const params = new URLSearchParams(search);
  if (params.get("utility") === "help") return { tab: "help" };
  const id = params.get("view");
  if (!id || !isNavigationSubItemId(id) || !isNavigationSubItemAvailable(id, { context })) return { tab: "home" };
  const target = getNavigationTarget(id, context);
  const mode = params.get("mode");
  const presentation = params.get("presentation");
  if (id === "work-risks" && params.get("risk")) return { ...target, riskId: params.get("risk")! };
  if (id === "work-schedule" && params.get("milestone")) return { ...target, taskView: "timeline", milestoneId: params.get("milestone")! };
  if (id === "work-activity" && presentation === "activity") return { ...target, worklogsView: "activity" };
  // Older result links land on the combined report history by default.
  if (id === "resources-structure" && mode === "cad" && context === "robot-project") return { tab: "cad" };
  return target;
}

export function writeNavigationLocation(state: NavigationState, context: ViewAvailabilityContext, search: string): string {
  const params = new URLSearchParams(search);
  const id = getActiveNavigationSubItemId(state, context);
  params.set("view", id ?? "home");
  if (id !== "work-schedule") params.delete("milestone");
  if (id !== "work-risks") params.delete("risk");
  params.delete("mode");
  params.delete("presentation");
  params.delete("utility");
  if (state.activeTab === "help") params.set("utility", "help");
  if (id === "work-activity" && state.worklogsView !== "logs") params.set("presentation", state.worklogsView);
  if (id === "resources-structure" && state.activeTab === "cad") params.set("mode", "cad");
  return `?${params.toString()}`;
}
