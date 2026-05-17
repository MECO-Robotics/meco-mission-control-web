/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_PROFILE_AVATAR_SIZE: 32,
}));

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { SessionUser } from "@/lib/auth/types";
import type { ProjectRecord } from "@/types/recordsOrganization";
import type { NavigationItem, NavigationSubItemId, ViewTab } from "@/lib/workspaceNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderSidebar(
  items: NavigationItem[],
  activeTab: ViewTab = "reports",
  options?: {
    favoriteViewIds?: NavigationSubItemId[];
    inventoryView?: "materials" | "parts" | "part-mappings" | "purchases";
    isMyViewActive?: boolean;
    myViewMemberName?: string | null;
    projects?: ProjectRecord[];
    riskManagementView?: "kanban" | "metrics";
    selectedProjectId?: string | null;
    sessionUser?: SessionUser | null;
    taskView?: "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
  },
) {
  return renderToStaticMarkup(
    React.createElement(AppSidebar, {
      activeTab,
      favoriteViewIds: options?.favoriteViewIds ?? [],
      handleSignOut: jest.fn(),
      inventoryView: options?.inventoryView ?? "materials",
      items,
      isDarkMode: false,
      isMyViewActive: options?.isMyViewActive ?? false,
      isCollapsed: false,
      myViewMemberName: options?.myViewMemberName === undefined ? "Ava Chen" : options.myViewMemberName,
      onCreateSeason: jest.fn(),
      onCreateRobot: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onSelectSeason: jest.fn(),
      onSelectProject: jest.fn(),
      onSelectTarget: jest.fn(),
      onToggleMyView: jest.fn(),
      projects: options?.projects ?? [],
      reportsView: "qa",
      rosterView: "directory",
      riskManagementView: options?.riskManagementView ?? "kanban",
      selectedProjectId: options?.selectedProjectId ?? null,
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
      sessionUser: options?.sessionUser ?? null,
      taskView: options?.taskView ?? "queue",
      toggleDarkMode: jest.fn(),
      toggleSidebar: jest.fn(),
      worklogsView: "logs",
    }),
  );
}

describe("AppSidebar", () => {
  const signedInUser: SessionUser = {
    accountId: "account-1",
    authProvider: "google",
    email: "ava.chen@example.com",
    hostedDomain: "meco-robotics.com",
    name: "Ava Chen",
    picture: null,
  };

  it("renders the profile assembly above the sidebar collapse control", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "tasks",
      { sessionUser: signedInUser },
    );

    expect(markup.indexOf("profile-menu")).toBeGreaterThan(-1);
    expect(markup.indexOf("profile-menu")).toBeLessThan(markup.indexOf("Collapse sidebar"));
    expect(markup).toContain('data-tutorial-target="season-select"');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Sign out");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
  });

  it("uses the signed-in profile control as the My View toggle", () => {
    const inactiveMarkup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "tasks",
      { sessionUser: signedInUser },
    );
    const activeMarkup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "tasks",
      {
        isMyViewActive: true,
        sessionUser: signedInUser,
      },
    );

    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger[^"]*app-profile-my-view-button)(?=[^>]*aria-label="Show My View filter")(?=[^>]*aria-pressed="false")[^>]*>/,
    );
    expect(inactiveMarkup).toContain("profile-view-group-icon");

    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger[^"]*app-profile-my-view-button)(?=[^>]*aria-label="Clear My View filter")(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(activeMarkup).toContain("Showing Ava Chen");
    expect(activeMarkup).toContain("profile-avatar-fallback");
    expect(activeMarkup).not.toContain("profile-view-group-icon");
  });

  it("uses an L avatar bubble for local dev-bypass profile state", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "tasks",
      {
        isMyViewActive: true,
        myViewMemberName: "Local Dev",
        sessionUser: {
          accountId: "local-dev",
          authProvider: "email",
          email: "dev@meco-robotics.com",
          hostedDomain: "meco-robotics.com",
          name: "Development User",
          picture: null,
        },
      },
    );

    expect(markup).toContain("profile-avatar-fallback");
    expect(markup).toContain(">L</span>");
  });

  it("keeps the local profile fallback as an L bubble with theme menu access", () => {
    const markup = renderSidebar([
      {
        value: "tasks",
        label: "Tasks",
        icon: React.createElement("span"),
        count: 4,
      },
    ]);

    expect(markup).toContain('aria-label="Local dev profile"');
    expect(markup).toContain("app-topbar-local-avatar");
    expect(markup).toContain(">L</span>");
    expect(markup).toContain("Theme mode");
    expect(markup).not.toContain("Local access");
  });

  it("keeps the profile menu hover-only instead of opening from trigger focus", () => {
    const css = readFileSync("src/app/styles/shell/profile/menu-shell/context.css", "utf8");

    expect(css).toContain(".profile-menu:hover .profile-menu-popover");
    expect(css).not.toContain(".profile-menu:focus-within .profile-menu-popover");
  });

  it("keeps the profile hover target enabled when My View has no roster match", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "tasks",
      {
        myViewMemberName: null,
        sessionUser: signedInUser,
      },
    );

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger[^"]*app-profile-my-view-button)(?=[^>]*aria-disabled="true")(?![^>]*\sdisabled(?:=|\s|>))[^>]*>/,
    );
  });

  it("renders Favorites above Dashboard as an expanded section", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
        {
          value: "risk-management",
          label: "Risks",
          icon: React.createElement("span"),
          count: 2,
        },
      ],
      "tasks",
      {
        favoriteViewIds: ["tasks-timeline"],
        taskView: "timeline",
      },
    );

    expect(markup.indexOf("Favorites")).toBeGreaterThan(-1);
    expect(markup.indexOf("Favorites")).toBeLessThan(markup.indexOf("Dashboard"));
    expect(markup).toMatch(
      /<div[^>]*class="[^"]*sidebar-favorites-group[^"]*"[\s\S]*?<span class="sidebar-subtab-label">Timeline<\/span>/,
    );
  });

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

  it("renders Activity in Dashboard when work logs are available", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 3,
        },
        {
          value: "risk-management",
          label: "Risks",
          icon: React.createElement("span"),
          count: 2,
        },
        {
          value: "worklogs",
          label: "Work logs",
          icon: React.createElement("span"),
          count: 5,
        },
      ],
      "tasks",
      { taskView: "calendar" },
    );

    expect(markup).toContain("Dashboard");
    expect(markup).toContain("Activity");
  });

  it("renders Readiness with action required, milestones, subsystems, and risks", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
        {
          value: "risk-management",
          label: "Risks",
          icon: React.createElement("span"),
          count: 3,
        },
        {
          value: "subsystems",
          label: "Subsystems",
          icon: React.createElement("span"),
          count: 5,
        },
      ],
      "risk-management",
      { riskManagementView: "kanban" },
    );

    expect(markup).toContain("Readiness");
    expect(markup).toContain("Action Required");
    expect(markup).toContain("Milestones");
    expect(markup).toContain("Subsystems");
    expect(markup).toContain("Risks");
  });

  it("renders Config with robot configuration, part mappings, and directory", () => {
    const robotProject: ProjectRecord = {
      id: "robot-1",
      name: "Robot 2026",
      projectType: "robot",
      seasonId: "season-1",
      description: "Test robot",
      status: "active",
    };

    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
        {
          value: "inventory",
          label: "Inventory",
          icon: React.createElement("span"),
          count: 7,
        },
        {
          value: "roster",
          label: "Roster",
          icon: React.createElement("span"),
          count: 5,
        },
      ],
      "tasks",
      {
        projects: [robotProject],
        selectedProjectId: robotProject.id,
        taskView: "robot-map",
      },
    );

    expect(markup).toContain("Config");
    expect(markup).toContain("Robot Configuration");
    expect(markup).toContain("Part mappings");
    expect(markup).toContain("Directory");
  });

  it("renders unavailable task views as disabled instead of hiding them", () => {
    const operationsProject: ProjectRecord = {
      id: "ops-1",
      name: "Operations",
      projectType: "operations",
      seasonId: "season-1",
      description: "Ops workspace",
      status: "active",
    };

    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
        {
          value: "inventory",
          label: "Inventory",
          icon: React.createElement("span"),
          count: 7,
        },
        {
          value: "roster",
          label: "Roster",
          icon: React.createElement("span"),
          count: 5,
        },
      ],
      "tasks",
      {
        projects: [operationsProject],
        selectedProjectId: operationsProject.id,
      },
    );

    expect(markup).toContain("Manufacturing");
    expect(markup).toMatch(
      /data-enabled="false"[^>]*disabled[^>]*>[\s\S]*?<span class="sidebar-subtab-label">Manufacturing<\/span>/,
    );
  });

  it("renders inapplicable groups as disabled controls that can reveal disabled subviews", () => {
    const markup = renderSidebar(
      [
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "reports",
      { taskView: "queue" },
    );

    expect(markup).toContain("Reports");
    expect(markup).toMatch(
      /<button(?=[^>]*data-tutorial-target="sidebar-tab-reports")(?=[^>]*data-enabled="false")(?=[^>]*aria-disabled="true")(?![^>]*\sdisabled(?:=|\s|>))[^>]*>/,
    );
    expect(markup).toMatch(
      /data-enabled="false"[^>]*disabled[^>]*>[\s\S]*?<span class="sidebar-subtab-label">QA forms<\/span>/,
    );
    expect(markup).toMatch(
      /data-enabled="false"[^>]*disabled[^>]*>[\s\S]*?<span class="sidebar-subtab-label">Milestone results<\/span>/,
    );
  });

});
