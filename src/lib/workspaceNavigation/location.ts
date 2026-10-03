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
  if (id === "work-schedule" && params.get("milestone")) return { ...target, taskView: "agenda", milestoneId: params.get("milestone")! };
  if (id === "work-schedule" && (presentation === "timeline" || presentation === "agenda")) return { ...target, taskView: presentation };
  if (id === "work-activity" && presentation === "activity") return { ...target, worklogsView: "activity" };
  if (id === "resources-qa-reports" && presentation === "results") return { ...target, worklogsView: "results" };
  if (id === "resources-structure" && mode === "cad" && context === "robot-project") return { tab: "cad" };
  return target;
}

export function writeNavigationLocation(state: NavigationState, context: ViewAvailabilityContext, search: string): string {
  const params = new URLSearchParams(search);
  const id = getActiveNavigationSubItemId(state, context);
  params.set("view", id ?? "home");
  if (id !== "work-schedule") params.delete("milestone");
  params.delete("mode");
  params.delete("presentation");
  params.delete("utility");
  if (state.activeTab === "help") params.set("utility", "help");
  if (id === "work-schedule" && state.taskView !== "calendar") params.set("presentation", state.taskView);
  if (id === "work-activity" && state.worklogsView !== "logs") params.set("presentation", state.worklogsView);
  if (id === "resources-qa-reports" && state.worklogsView !== "qa") params.set("presentation", state.worklogsView);
  if (id === "resources-structure" && state.activeTab === "cad") params.set("mode", "cad");
  return `?${params.toString()}`;
}
