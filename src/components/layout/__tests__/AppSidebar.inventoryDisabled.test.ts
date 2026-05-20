/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_PROFILE_AVATAR_SIZE: 32,
}));

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
        favoriteViewIds: [],
        handleSignOut: jest.fn(),
        inventoryView: "materials",
        items,
        isDarkMode: false,
        isMyViewActive: false,
        isCollapsed: false,
        isNotificationQueueOpen: false,
        myViewMemberName: "Ava Chen",
        notificationCount: 0,
        onCreateMilestone: jest.fn(),
        onCreatePart: jest.fn(),
        onCreateQaReport: jest.fn(),
        onCreateSeason: jest.fn(),
        onCreateTask: jest.fn(),
        onCreateRobot: jest.fn(),
        onEditSelectedRobot: jest.fn(),
        onRefreshWorkspace: jest.fn(),
        onSelectSeason: jest.fn(),
        onSelectProject: jest.fn(),
        onSelectTarget: jest.fn(),
        onToggleMyView: jest.fn(),
        onToggleNotificationQueue: jest.fn(),
        projects: [],
        reportsView: "qa",
        rosterView: "directory",
        riskManagementView: "kanban",
        selectedProjectId: null,
        selectedSeasonId: "season-1",
        seasons: [
          {
            id: "season-1",
            name: "2026 Season",
            type: "season",
            startDate: "2026-01-01",
            endDate: "2026-12-31",
          },
        ],
        sessionUser: null,
        taskView: "queue",
        toggleDarkMode: jest.fn(),
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
