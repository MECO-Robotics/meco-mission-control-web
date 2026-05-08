/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { NavigationItem } from "@/lib/workspaceNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("AppSidebar inventory availability", () => {
  it("disables inventory materials and purchases when inventory is unavailable", () => {
    const items: NavigationItem[] = [
      {
        value: "tasks",
        label: "Tasks",
        icon: React.createElement("span"),
        count: 4,
      },
    ];
    const markup = renderToStaticMarkup(
      React.createElement(AppSidebar, {
        activeTab: "inventory",
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

    expect(markup).toContain("Inventory");
    expect(markup).toMatch(
      /data-enabled="false"[^>]*disabled[^>]*>[\s\S]*?<span class="sidebar-subtab-label">Materials<\/span>/,
    );
    expect(markup).toMatch(
      /data-enabled="false"[^>]*disabled[^>]*>[\s\S]*?<span class="sidebar-subtab-label">Purchases<\/span>/,
    );
  });
});
