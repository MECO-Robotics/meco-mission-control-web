/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { NavigationItem, ViewTab } from "@/lib/workspaceNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderSidebar(items: NavigationItem[], activeTab: ViewTab = "reports") {
  return renderToStaticMarkup(
    React.createElement(AppSidebar, {
      activeTab,
      inventoryView: "materials",
      items,
      isCollapsed: false,
      onCreateRobot: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onSelectProject: jest.fn(),
      onSelectTarget: jest.fn(),
      projects: [],
      reportsView: "qa",
      rosterView: "directory",
      riskManagementView: "kanban",
      selectedProjectId: null,
      taskView: "queue",
      toggleSidebar: jest.fn(),
      worklogsView: "logs",
    }),
  );
}

describe("AppSidebar", () => {
  it("renders the Reports section with requested report subtabs", () => {
    const markup = renderSidebar([
      {
        value: "reports",
        label: "Reports",
        icon: React.createElement("span"),
        count: 4,
      },
      {
        value: "worklogs",
        label: "Work logs",
        icon: React.createElement("span"),
        count: 2,
      },
      {
        value: "tasks",
        label: "Tasks",
        icon: React.createElement("span"),
        count: 8,
      },
      {
        value: "risk-management",
        label: "Risks",
        icon: React.createElement("span"),
        count: 3,
      },
      {
        value: "roster",
        label: "Roster",
        icon: React.createElement("span"),
        count: 6,
      },
    ]);

    expect(markup).toContain("Reports");
    expect(markup).toContain('data-tutorial-target="sidebar-tab-reports"');
    expect(markup).toContain("QA forms");
    expect(markup).toContain("Milestone results");
  });

  it("renders the sidebar toggle and new Dashboard section", () => {
    const markup = renderSidebar([
      {
        value: "tasks",
        label: "Tasks",
        icon: React.createElement("span"),
        count: 0,
      },
      {
        value: "reports",
        label: "Reports",
        icon: React.createElement("span"),
        count: 4,
      },
      {
        value: "risk-management",
        label: "Risks",
        icon: React.createElement("span"),
        count: 2,
      },
    ]);

    expect(markup).toContain("Collapse sidebar");
    expect(markup).toContain("Dashboard");
  });
});
