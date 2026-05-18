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
    isCollapsed?: boolean;
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
      isCollapsed: options?.isCollapsed ?? false,
      myViewMemberName: options?.myViewMemberName === undefined ? "Ava Chen" : options.myViewMemberName,
      onCreateSeason: jest.fn(),
      onCreateMilestone: jest.fn(),
      onCreatePart: jest.fn(),
      onCreateQaReport: jest.fn(),
      onCreateRobot: jest.fn(),
      onCreateTask: jest.fn(),
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

  it("renders the icon-only fold control to the right of the profile switch", () => {
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
    expect(markup.indexOf("profile-view-toggle")).toBeLessThan(markup.indexOf("sidebar-profile-fold-button"));
    expect(markup.indexOf("sidebar-profile-fold-button")).toBeLessThan(markup.indexOf("sidebar-quick-actions"));
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-profile-fold-button)(?=[^>]*aria-label="Collapse sidebar")[^>]*>[\s\S]*lucide-arrow-left-to-line[\s\S]*<\/button>/,
    );
    expect(markup).not.toContain('<span class="sidebar-tab-label">Collapse sidebar</span>');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Sign out");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
    expect(markup).not.toContain("profile-menu-context-picker");
  });

  it("reveals the folded sidebar expand button only on collapsed hover or keyboard focus", () => {
    const css = readFileSync("src/app/styles/shell/sidebar-profile.css", "utf8");

    expect(css).toMatch(
      /\.sidebar-profile-header\[data-collapsed="true"\] \.sidebar-profile-fold-button\s*\{[^}]*position:\s*absolute;[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;[^}]*z-index:\s*1300;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-header\[data-collapsed="true"\]::after\s*\{[^}]*content:\s*"";[^}]*left:\s*100%;[^}]*width:\s*2\.5rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-shell\[data-collapsed="true"\]:hover \.sidebar-profile-fold-button,\s*\.sidebar-shell\[data-collapsed="true"\] \.sidebar-profile-fold-button:focus-visible\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/,
    );
  });

  it("clears mouse focus after the sidebar fold button is clicked", () => {
    const source = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");

    expect(source).toMatch(/const handleSidebarFoldClick = \(event: ReactMouseEvent<HTMLButtonElement>\) => \{[\s\S]*toggleSidebar\(\);[\s\S]*event\.currentTarget\.blur\(\);[\s\S]*\};/);
    expect(source).toContain("onClick={handleSidebarFoldClick}");
  });

  it("renders the season selector in the sidebar footer above project scope", () => {
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
    const footerIndex = markup.indexOf("sidebar-footer-stack");
    const seasonIndex = markup.indexOf('data-tutorial-target="season-select"');
    const projectIndex = markup.indexOf('data-tutorial-target="project-select"');

    expect(seasonIndex).toBeGreaterThan(footerIndex);
    expect(seasonIndex).toBeLessThan(projectIndex);
    expect(markup).toContain('<span class="sidebar-context-label">Season</span>');
    expect(markup).toContain("Create new season");
  });

  it("renders My View as a group-to-profile toggle with the avatar on the right", () => {
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

    expect(inactiveMarkup).toContain("profile-view-toggle");
    expect(inactiveMarkup.indexOf("profile-view-group-icon")).toBeLessThan(
      inactiveMarkup.indexOf("profile-view-avatar-button"),
    );
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-view-group-button[^"]*is-active)(?=[^>]*aria-label="All workspace members")(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-view-avatar-button)(?=[^>]*aria-label="Show My View filter")(?=[^>]*aria-pressed="false")[^>]*>/,
    );
    expect(inactiveMarkup).toContain("profile-view-group-icon");
    expect(inactiveMarkup).toContain("profile-avatar-fallback");

    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-view-avatar-button[^"]*is-active)(?=[^>]*aria-label="Clear My View filter")(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(activeMarkup).toContain("Showing Ava Chen");
    expect(activeMarkup).toContain("profile-avatar-fallback");
    expect(activeMarkup).toContain("profile-view-group-icon");
  });

  it("shrinks the inactive profile avatar inside the My View toggle", () => {
    const css = readFileSync("src/app/styles/shell/profile/my-view-toggle.css", "utf8");

    expect(css).toMatch(
      /\.profile-view-avatar-button:not\(\.is-active\) \.profile-avatar\s*\{[^}]*width:\s*1\.22rem;[^}]*height:\s*1\.22rem;[^}]*font-size:\s*0\.72rem;/,
    );
  });

  it("shows only the active profile toggle state when the sidebar is folded", () => {
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
      {
        isCollapsed: true,
        sessionUser: signedInUser,
      },
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
        isCollapsed: true,
        isMyViewActive: true,
        sessionUser: signedInUser,
      },
    );
    const css = readFileSync("src/app/styles/shell/profile/my-view-toggle.css", "utf8");

    expect(inactiveMarkup).toContain('sidebar-profile-header" data-collapsed="true"');
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-view-group-button[^"]*is-active)(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-view-avatar-button[^"]*is-active)(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-header\[data-collapsed="true"\] \.profile-view-toggle-option:not\(\.is-active\)\s*\{[^}]*display:\s*none;/,
    );
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
      /<button(?=[^>]*class="[^"]*profile-view-avatar-button)(?=[^>]*aria-disabled="true")(?![^>]*\sdisabled(?:=|\s|>))[^>]*>/,
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

  it("renders Home, Add, and Today controls below the profile", () => {
    const markup = renderSidebar(
      [
        {
          value: "home",
          label: "Home",
          icon: React.createElement("span"),
          count: 0,
        },
        {
          value: "today",
          label: "Today",
          icon: React.createElement("span"),
          count: 3,
        },
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "home",
      { sessionUser: signedInUser },
    );

    expect(markup.indexOf("sidebar-profile-header")).toBeGreaterThan(-1);
    expect(markup.indexOf("sidebar-profile-header")).toBeLessThan(markup.indexOf("sidebar-quick-actions"));
    expect(markup.indexOf("sidebar-profile-fold-button")).toBeLessThan(markup.indexOf("sidebar-quick-actions"));
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-home)(?=[^>]*aria-label="Home")(?=[^>]*data-active="true")[^>]*>/,
    );
    expect(markup).toMatch(
      /<summary(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-add)(?=[^>]*aria-label="Add new")[^>]*>[\s\S]*<\/summary>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-today)(?=[^>]*aria-label="Today")(?=[^>]*data-active="false")[^>]*>/,
    );
    expect(markup).toContain("Add task");
    expect(markup).toContain("Add report");
    expect(markup).toContain("Add milestone");
    expect(markup).toContain("Add part");
  });

  it("uses one shared underline for the Home, Add, and Today quick actions", () => {
    const css = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    expect(css).toMatch(/\.sidebar-quick-actions::after\s*\{/);
    expect(css).not.toMatch(/\.sidebar-quick-action::after\s*\{/);
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
