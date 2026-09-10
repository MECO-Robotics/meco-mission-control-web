import {
  NAVIGATION_SECTION_ORDER, NAVIGATION_SUB_ITEMS, VIEW_AVAILABILITY_CONTEXTS,
  getActiveNavigationSubItemId, getNavigationTarget, isNavigationSubItemAvailable,
  normalizeNavigationSubItemId, readNavigationLocation, writeNavigationLocation,
  type NavigationState,
} from "@/lib/workspaceNavigation";
const state: NavigationState = { activeTab: "home", taskView: "queue", riskManagementView: "kanban", worklogsView: "logs", inventoryView: "materials", manufacturingView: "all", rosterView: "directory" };
describe("canonical workspace navigation", () => {
  it("provides four areas and unique destinations", () => {
    expect(NAVIGATION_SECTION_ORDER).toEqual(["home", "work", "resources", "team"]);
    expect(new Set(NAVIGATION_SUB_ITEMS.map((item) => item.id)).size).toBe(13);
    expect(normalizeNavigationSubItemId("reports-worklogs")).toBeNull();
  });
  it.each(VIEW_AVAILABILITY_CONTEXTS)("round trips every available destination in %s", (context) => {
    for (const item of NAVIGATION_SUB_ITEMS) {
      if (!isNavigationSubItemAvailable(item.id, { context })) continue;
      const target = getNavigationTarget(item.id, context);
      const next = { ...state, ...target, activeTab: target.tab };
      expect(getActiveNavigationSubItemId(next, context)).toBe(item.id);
      expect(readNavigationLocation(writeNavigationLocation(next, context, ""), context)).toEqual(target);
    }
  });
  it("uses distinct materials and documents destinations by project", () => {
    expect(isNavigationSubItemAvailable("resources-documents", { context: "robot-project" })).toBe(false);
    expect(isNavigationSubItemAvailable("resources-materials", { context: "non-robot-project" })).toBe(false);
    expect(getNavigationTarget("resources-structure", "non-robot-project")).toEqual({ tab: "subsystems" });
  });
  it("retains schedule presentation and unrelated URL parameters on refresh", () => {
    const next = { ...state, activeTab: "tasks" as const, taskView: "timeline" as const };
    const search = writeNavigationLocation(next, "robot-project", "?season=s&project=p");
    expect(new URLSearchParams(search).get("project")).toBe("p");
    expect(readNavigationLocation(search, "robot-project")).toEqual({ tab: "tasks", taskView: "timeline" });
  });
  it("rejects unknown and unavailable destinations and presentation values", () => {
    expect(readNavigationLocation("?view=resources-parts", "non-robot-project")).toEqual({ tab: "home" });
    expect(readNavigationLocation("?view=unknown", "robot-project")).toEqual({ tab: "home" });
    expect(readNavigationLocation("?view=work-schedule&mode=cad", "robot-project")).toEqual({ tab: "tasks", taskView: "calendar" });
  });
  it("keeps CAD nested under Structure", () => {
    expect(writeNavigationLocation({ ...state, activeTab: "cad" }, "robot-project", "")).toBe("?view=resources-structure&mode=cad");
    expect(readNavigationLocation("?view=resources-structure&mode=cad", "robot-project")).toEqual({ tab: "cad" });
  });
});
