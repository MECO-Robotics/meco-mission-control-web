/// <reference types="jest" />

import {
  BASE_SECTION_LABELS,
  NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX,
  VIEW_AVAILABILITY_CONTEXTS,
  getActiveNavigationSubItemId,
  isNavigationSubItemAvailable,
  isNavigationSubItemId,
  resolveViewAvailabilityContext,
  targetMatchesNavigationState,
  type NavigationState,
  type NavigationTarget,
  type ViewTab,
} from "@/lib/workspaceNavigation";

function createNavigationState(overrides: Partial<NavigationState> = {}): NavigationState {
  return {
    activeTab: "tasks",
    taskView: "timeline",
    riskManagementView: "kanban",
    worklogsView: "logs",
    reportsView: "qa",
    inventoryView: "materials",
    manufacturingView: "cnc",
    rosterView: "workload",
    ...overrides,
  };
}

describe("getActiveNavigationSubItemId", () => {
  it("maps tasks calendar to dashboard calendar", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "tasks", taskView: "calendar" }),
      ),
    ).toBe("dashboard-calendar");
  });

  it("maps tasks timeline to tasks timeline", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "tasks", taskView: "timeline" }),
      ),
    ).toBe("tasks-timeline");
  });

  it("maps tasks robot map to config robot configuration", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "tasks", taskView: "robot-map" }),
      ),
    ).toBe("config-robot-model");
  });

  it("maps risk metrics to dashboard metrics", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({
          activeTab: "risk-management",
          riskManagementView: "metrics",
        }),
      ),
    ).toBe("dashboard-metrics");
  });

  it("maps roster directory to config directory", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "roster", rosterView: "directory" }),
      ),
    ).toBe("config-directory");
  });

  it("maps roster available to roster available", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "roster", rosterView: "available" }),
      ),
    ).toBe("roster-available");
  });

  it("maps worklogs activity to dashboard activity", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "worklogs", worklogsView: "activity" }),
      ),
    ).toBe("dashboard-activity");
  });

  it("maps worklogs kanban to reports worklog kanban", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({
          activeTab: "worklogs",
          worklogsView: "kanban",
        }),
      ),
    ).toBe("reports-worklogs-kanban");
  });

  it("maps worklogs summary to reports work logs", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "worklogs", worklogsView: "summary" }),
      ),
    ).toBe("reports-work-logs");
  });

  it("returns null for help because it has no sidebar subitem", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "help" }),
      ),
    ).toBeNull();
  });

  it("returns null for home because quick actions own that page", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "home" }),
      ),
    ).toBeNull();
    expect(BASE_SECTION_LABELS.home).toBe("Home");
  });
});

describe("isNavigationSubItemId", () => {
  it("accepts sidebar subitems and rejects top-level quick action tabs", () => {
    expect(isNavigationSubItemId("tasks-timeline")).toBe(true);
    expect(isNavigationSubItemId("home")).toBe(false);
    expect(isNavigationSubItemId("notifications")).toBe(false);
  });
});

describe("targetMatchesNavigationState", () => {
  it("matches a target when all specified dimensions match", () => {
    const target: NavigationTarget = {
      tab: "reports",
      reportsView: "milestone-results",
    };

    expect(
      targetMatchesNavigationState(
        target,
        createNavigationState({
          activeTab: "reports",
          reportsView: "milestone-results",
        }),
      ),
    ).toBe(true);
  });

  it("does not match when a specified dimension differs", () => {
    const target: NavigationTarget = {
      tab: "inventory",
      inventoryView: "parts",
    };

    expect(
      targetMatchesNavigationState(
        target,
        createNavigationState({
          activeTab: "inventory",
          inventoryView: "materials",
        }),
      ),
    ).toBe(false);
  });
});

describe("view availability matrix", () => {
  it("documents every navigation subitem for every supported context", () => {
    for (const [subItemId, row] of Object.entries(NAVIGATION_SUB_ITEM_AVAILABILITY_MATRIX)) {
      expect(isNavigationSubItemId(subItemId)).toBe(true);

      for (const context of VIEW_AVAILABILITY_CONTEXTS) {
        expect(typeof row[context]).toBe("boolean");
      }
    }
  });

  it("resolves availability contexts from season and project scope", () => {
    expect(
      resolveViewAvailabilityContext({
        hasProjects: true,
        hasSeasons: false,
        selectedProjectType: null,
      }),
    ).toBe("no-season");
    expect(
      resolveViewAvailabilityContext({
        hasProjects: false,
        hasSeasons: true,
        selectedProjectType: null,
      }),
    ).toBe("no-project");
    expect(
      resolveViewAvailabilityContext({
        hasProjects: true,
        hasSeasons: true,
        selectedProjectType: null,
      }),
    ).toBe("all-project");
    expect(
      resolveViewAvailabilityContext({
        hasProjects: true,
        hasSeasons: true,
        selectedProjectType: "robot",
      }),
    ).toBe("robot-project");
    expect(
      resolveViewAvailabilityContext({
        hasProjects: true,
        hasSeasons: true,
        selectedProjectType: "operations",
      }),
    ).toBe("non-robot-project");
  });

  it("enables robot-only views only for robot project context", () => {
    expect(
      isNavigationSubItemAvailable("config-robot-model", {
        context: "robot-project",
      }),
    ).toBe(true);
    expect(
      isNavigationSubItemAvailable("config-robot-model", {
        context: "all-project",
      }),
    ).toBe(false);
    expect(
      isNavigationSubItemAvailable("tasks-manufacturing", {
        context: "non-robot-project",
      }),
    ).toBe(false);
  });

  it("disables otherwise valid views when the owning top-level tab is unavailable", () => {
    expect(
      isNavigationSubItemAvailable("inventory-materials", {
        context: "robot-project",
        visibleTabs: new Set<ViewTab>(["tasks"]),
      }),
    ).toBe(false);
  });
});
