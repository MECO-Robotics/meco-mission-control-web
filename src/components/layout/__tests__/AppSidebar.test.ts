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
      items,
      isCollapsed: false,
      onCreateRobot: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onSelectProject: jest.fn(),
      onSelectTab: jest.fn(),
      projects: [],
      selectedProjectId: null,
      toggleSidebar: jest.fn(),
    }),
  );
}

describe("AppSidebar", () => {
  it("renders the Reports sidebar page", () => {
    const markup = renderSidebar([
      {
        value: "reports",
        label: "Reports",
        icon: React.createElement("span"),
        count: 4,
      },
    ]);

    expect(markup).toContain("Reports");
    expect(markup).toContain('data-tutorial-target="sidebar-tab-reports"');
  });

  it("renders the sidebar toggle before the Tasks tab", () => {
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
    ]);

    expect(markup).toContain("Collapse sidebar");
    expect(markup.indexOf("Collapse sidebar")).toBeLessThan(markup.indexOf("Tasks"));
  });
});
