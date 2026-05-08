/// <reference types="jest" />

import {
  getActiveNavigationSubItemId,
  targetMatchesNavigationState,
  type NavigationState,
  type NavigationTarget,
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

  it("maps tasks robot map to config robot model", () => {
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

  it("maps worklogs activity to dashboard activity", () => {
    expect(
      getActiveNavigationSubItemId(
        createNavigationState({ activeTab: "worklogs", worklogsView: "activity" }),
      ),
    ).toBe("dashboard-activity");
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
