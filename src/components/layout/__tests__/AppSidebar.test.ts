/// <reference types="jest" />

import { existsSync, readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_PROFILE_AVATAR_SIZE: 32,
}));

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppSidebarPopups } from "@/components/layout/AppSidebarPopups";
import type { SessionUser } from "@/lib/auth/types";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
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
    isNotificationQueueOpen?: boolean;
    myViewMemberName?: string | null;
    notificationCount?: number;
    projects?: ProjectRecord[];
    riskManagementView?: "kanban" | "metrics";
    selectedProjectId?: string | null;
    sessionUser?: SessionUser | null;
    taskView?: "calendar" | "timeline" | "robot-map" | "queue" | "milestones";
  },
) {
  const sidebarProps: React.ComponentProps<typeof AppSidebar> = {
      activeTab,
      favoriteViewIds: options?.favoriteViewIds ?? [],
      handleSignOut: jest.fn(),
      inventoryView: options?.inventoryView ?? "materials",
      items,
      isDarkMode: false,
      isMyViewActive: options?.isMyViewActive ?? false,
      isCollapsed: options?.isCollapsed ?? false,
      isNotificationQueueOpen: options?.isNotificationQueueOpen ?? false,
      myViewMemberName: options?.myViewMemberName === undefined ? "Ava Chen" : options.myViewMemberName,
      notificationCount: options?.notificationCount ?? 0,
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
      onToggleNotificationQueue: jest.fn(),
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
    };

  return renderToStaticMarkup(React.createElement(AppSidebar, sidebarProps));
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

  it("renders the top triplet as Home, Add, and Fold with profile above scope", () => {
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
    const quickIndex = markup.indexOf("sidebar-quick-actions");
    const homeIndex = markup.indexOf("sidebar-quick-action-home");
    const addIndex = markup.indexOf("sidebar-quick-action-add");
    const foldIndex = markup.indexOf("sidebar-quick-action-fold");
    const footerIndex = markup.indexOf("sidebar-footer-stack");
    const profileIndex = markup.indexOf("sidebar-footer-profile");
    const scopeIndex = markup.indexOf("sidebar-scope-trigger");

    expect(homeIndex).toBeGreaterThan(quickIndex);
    expect(homeIndex).toBeLessThan(addIndex);
    expect(addIndex).toBeLessThan(foldIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Collapse sidebar")[^>]*>[\s\S]*lucide-panel-left-close[\s\S]*<\/button>/,
    );
    expect(markup).not.toContain("sidebar-profile-fold-button");
    expect(profileIndex).toBeGreaterThan(footerIndex);
    expect(profileIndex).toBeLessThan(scopeIndex);
    expect(markup.indexOf("profile-view-switch")).toBeGreaterThan(profileIndex);
    expect(markup).not.toContain('<span class="sidebar-tab-label">Collapse sidebar</span>');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Sign out");
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup).not.toContain('aria-label="Refresh workspace"');
    expect(markup).not.toContain("profile-menu-context-picker");
  });

  it("keeps the folded sidebar expand button in the top triplet", () => {
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
        isCollapsed: true,
        sessionUser: signedInUser,
      },
    );

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Expand sidebar")[^>]*>[\s\S]*lucide-panel-left-open[\s\S]*<\/button>/,
    );
    expect(markup.indexOf("sidebar-quick-action-fold")).toBeGreaterThan(markup.indexOf("sidebar-quick-action-add"));
    expect(markup).not.toContain("sidebar-profile-fold-button");
  });

  it("clears mouse focus after the sidebar fold button is clicked", () => {
    const source = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");

    expect(source).toMatch(/const handleSidebarFoldClick = \(event: ReactMouseEvent<HTMLButtonElement>\) => \{[\s\S]*toggleSidebar\(\);[\s\S]*event\.currentTarget\.blur\(\);[\s\S]*\};/);
    expect(source).toContain("onToggleSidebar={handleSidebarFoldClick}");
  });

  it("renders Settings, Help, and Notifications as the bottom triplet", () => {
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
    const footerActionsIndex = markup.indexOf("sidebar-footer-actions");
    const settingsIndex = markup.indexOf("sidebar-settings-menu");
    const helpIndex = markup.indexOf("sidebar-footer-action-help");
    const notificationsIndex = markup.indexOf("sidebar-footer-action-notifications");
    const css = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    expect(settingsIndex).toBeGreaterThan(footerActionsIndex);
    expect(settingsIndex).toBeLessThan(helpIndex);
    expect(helpIndex).toBeLessThan(notificationsIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-settings)(?=[^>]*aria-label="Settings")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-help)(?=[^>]*aria-label="Help")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-notifications)(?=[^>]*aria-label="Notifications")[^>]*>/,
    );
    expect(markup).toContain('aria-label="Settings menu"');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("sidebar-settings-menu-value");
    expect(markup).toContain("lucide-settings");
    expect(markup).toContain("lucide-log-out");
    expect(markup).toContain("lucide-bell");
    expect(css).toMatch(
      /\.sidebar-footer-actions::before\s*\{[^}]*right:\s*0\.72rem;[^}]*top:\s*0\.23rem;[^}]*left:\s*0\.72rem;[^}]*height:\s*2px;[^}]*border-radius:\s*999px;[^}]*background:\s*rgba\(15, 28, 52, 0\.16\);/,
    );
    expect(css).toMatch(
      /\.sidebar-quick-actions\[data-collapsed="true"\]::after,\s*\.sidebar-footer-actions\[data-collapsed="true"\]::before\s*\{[^}]*right:\s*0\.4rem;[^}]*left:\s*0\.4rem;/,
    );
  });

  it("positions Add and Settings menus outside the sidebar clipping boundary", () => {
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");
    const settingsCss = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");

    expect(quickCss).toMatch(
      /\.sidebar-add-menu-panel\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);[^}]*transform:\s*none;/,
    );
    expect(settingsCss).toMatch(
      /\.sidebar-footer-actions \.sidebar-settings-popover\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);/,
    );
  });

  it("opens the Settings menu from hover preview or click state", () => {
    const footerSource = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");
    const settingsCss = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");
    const settingsSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarSettingsMenu.tsx",
      "utf8",
    );

    expect(footerSource).toContain("<AppSidebarSettingsMenu");
    expect(footerSource).not.toContain("<details");
    expect(footerSource).not.toContain("<summary");
    expect(settingsCss).toMatch(
      /\.sidebar-settings-menu\[data-open="true"\] \.sidebar-settings-popover\s*\{[^}]*display:\s*grid;/,
    );
    expect(settingsCss).not.toContain(".sidebar-settings-menu:hover .sidebar-settings-popover");
    expect(settingsCss).not.toContain(".sidebar-settings-menu[open] .sidebar-settings-popover");
    expect(settingsCss).not.toContain(":focus-within");
    expect(settingsSource).toContain('data-open={isMenuOpen ? "true" : "false"}');
    expect(settingsSource).toContain("onMouseEnter={handleSettingsHover}");
    expect(settingsSource).toContain("onClick={handleSettingsClick}");
    expect(settingsSource).toContain('closest(".sidebar")');
    expect(settingsSource).toContain('addEventListener("mouseleave", closeHoverMenu)');
    expect(settingsSource).toContain('document.addEventListener("pointerdown", dismissOnOutsidePointer)');
    expect(quickCss).toContain(".sidebar-settings-menu:hover > .sidebar-quick-action");
    expect(quickCss).toContain('.sidebar-settings-menu[data-open="true"] > .sidebar-quick-action');
    expect(quickCss).not.toContain(".sidebar-settings-menu[open] > .sidebar-quick-action");
    expect(quickCss).not.toContain(":focus-within");
  });

  it("opens the Add menu from hover preview or click state", () => {
    const quickSource = readFileSync("src/components/layout/AppSidebarQuickActions.tsx", "utf8");
    const addSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarAddMenu.tsx",
      "utf8",
    );
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    expect(quickSource).toContain("<AppSidebarAddMenu");
    expect(quickSource).not.toContain("<details");
    expect(quickSource).not.toContain("<summary");
    expect(addSource).toContain('data-open={isAddMenuOpen ? "true" : "false"}');
    expect(addSource).toContain("onMouseEnter={handleAddHover}");
    expect(addSource).toContain("onClick={handleAddClick}");
    expect(addSource).toContain('closest(".sidebar")');
    expect(addSource).toContain('addEventListener("mouseleave", closeHoverMenu)');
    expect(addSource).toContain('document.addEventListener("pointerdown", dismissOnOutsidePointer)');
    expect(addSource).toContain("handleAddActionSelect");
    expect(quickCss).toContain('.sidebar-add-menu[data-open="true"] > .sidebar-quick-action');
    expect(quickCss).toContain('.sidebar-add-menu:not([data-open="true"]) .sidebar-add-menu-panel');
    expect(quickCss).not.toContain(".sidebar-add-menu[open]");
  });

  it("keeps the bottom triplet icon-only when the sidebar is folded", () => {
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
        isCollapsed: true,
        sessionUser: signedInUser,
      },
    );
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");
    const settingsIndex = markup.indexOf("sidebar-settings-collapsed-trigger");
    const helpIndex = markup.indexOf("sidebar-help-collapsed-trigger");
    const notificationsIndex = markup.indexOf("sidebar-footer-action-notifications");

    expect(settingsIndex).toBeGreaterThan(-1);
    expect(settingsIndex).toBeLessThan(helpIndex);
    expect(helpIndex).toBeLessThan(notificationsIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-settings-collapsed-trigger)(?=[^>]*aria-label="Settings")[^>]*>/,
    );
    expect(markup).not.toContain('<span class="sidebar-tab-label">Settings</span>');
    expect(markup).not.toContain('<span class="sidebar-tab-label">Help</span>');
    expect(css).toMatch(
      /\.sidebar-settings-menu-collapsed \.sidebar-settings-popover\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);/,
    );
  });

  it("renders the project scope pill with only the selected project label", () => {
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
      ],
      "tasks",
      {
        projects: [robotProject],
        selectedProjectId: robotProject.id,
        sessionUser: signedInUser,
      },
    );
    const footerIndex = markup.indexOf("sidebar-footer-stack");
    const profileIndex = markup.indexOf("sidebar-footer-profile");
    const scopeIndex = markup.indexOf("sidebar-scope-trigger");

    expect(profileIndex).toBeGreaterThan(footerIndex);
    expect(profileIndex).toBeLessThan(scopeIndex);
    expect(scopeIndex).toBeGreaterThan(footerIndex);
    expect(markup).toContain('aria-label="Project scope"');
    expect(markup).toContain('data-tutorial-target="project-select"');
    expect(markup).toContain("Robot 2026");
    expect(markup).not.toContain('data-tutorial-target="season-select"');
    expect(markup).not.toContain("2026 Season");
    expect(markup).not.toContain("sidebar-season-select");
    expect(markup).not.toContain("sidebar-project-trigger");
  });

  it("renders season then project as visible two-stage scope popup panels", () => {
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-scope.css", "utf8");
    const seasons: SeasonRecord[] = [
      {
        id: "season-1",
        name: "2026 Season",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
      {
        id: "season-2",
        name: "2027 Season",
        type: "season",
        startDate: "2027-01-01",
        endDate: "2027-12-31",
      },
    ];
    const robotProject: ProjectRecord = {
      id: "robot-1",
      name: "Robot 2026",
      projectType: "robot",
      seasonId: "season-1",
      description: "Test robot",
      status: "active",
    };
    const baseProps = {
      activeSubItemId: null,
      compactPopupRef: React.createRef<HTMLDivElement>(),
      compactPopupSection: null,
      compactPopupTop: 0,
      getSectionSubItems: () => [],
      isCollapsed: false,
      isProjectPopupOpen: false,
      onEditSelectedRobot: jest.fn(),
      onSelectProjectOption: jest.fn(),
      onSelectSeasonOption: jest.fn(),
      onSubItemSelect: jest.fn(),
      projectPopupRef: React.createRef<HTMLDivElement>(),
      projectPopupTop: 0,
      projects: [robotProject],
      seasons,
      selectedProjectId: robotProject.id,
      selectedSeasonId: "season-1",
    };
    const scopeMarkup = renderToStaticMarkup(
      React.createElement(AppSidebarPopups, {
        ...baseProps,
        isScopePopupOpen: true,
      } as unknown as React.ComponentProps<typeof AppSidebarPopups>),
    );
    const seasonPanelIndex = scopeMarkup.indexOf('data-scope-panel="season"');
    const projectPanelIndex = scopeMarkup.indexOf('data-scope-panel="project"');

    expect(scopeMarkup).toContain("sidebar-scope-popup-shell");
    expect(scopeMarkup).toContain("sidebar-scope-target-panel");
    expect(scopeMarkup).not.toContain("sidebar-scope-kind-panel");
    expect(scopeMarkup).not.toContain(">Scope<");
    expect(seasonPanelIndex).toBeGreaterThan(-1);
    expect(projectPanelIndex).toBeGreaterThan(-1);
    expect(seasonPanelIndex).toBeLessThan(projectPanelIndex);
    expect(scopeMarkup).toContain("Seasons");
    expect(scopeMarkup).toContain("2027 Season");
    expect(scopeMarkup).toContain("Create new season");
    expect(scopeMarkup).toContain("Projects");
    expect(scopeMarkup).toContain("All projects");
    expect(scopeMarkup).toContain("Robot 2026");
    expect(scopeMarkup).toContain("Edit robot name");
    expect(scopeMarkup).toContain("Add robot");
    expect(css).toMatch(
      /\.sidebar-scope-target-panel\[data-scope-panel="season"\]\s*\{[^}]*align-self:\s*flex-end;/,
    );
  });

  it("renders the project scope trigger as a larger footer control", () => {
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-scope.css", "utf8");
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

    expect(markup).toContain("sidebar-scope-trigger");
    expect(markup).toContain('width="16"');
    expect(markup).toContain("sidebar-scope-trigger-caret");
    expect(markup).toContain("lucide-chevron-right");
    expect(css).toMatch(
      /\.sidebar-scope-trigger\s*\{[^}]*min-height:\s*2\.35rem;[^}]*padding:\s*0\.48rem 0\.54rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-scope-trigger-line\s*\{[^}]*font-size:\s*0\.78rem;[^}]*font-weight:\s*760;/,
    );
    expect(css).toMatch(
      /\.sidebar-scope-trigger-caret\s*\{[^}]*margin-left:\s*auto;[^}]*opacity:\s*0\.68;/,
    );
  });

  it("renders My View as a stacked switch with the alternate view on the left", () => {
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

    expect(inactiveMarkup).toContain("profile-view-switch sidebar-profile-toggle");
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="All users view\. Switch to personal view\.")(?=[^>]*aria-pressed="false")(?=[^>]*data-view="all")[^>]*>/,
    );
    expect(inactiveMarkup).toMatch(
      /profile-view-option-other[\s\S]*profile-avatar-fallback[\s\S]*A[\s\S]*profile-view-option-selected[\s\S]*lucide-users/,
    );
    expect(inactiveMarkup).toContain("Switch view");
    expect(inactiveMarkup).toContain("profile-view-switch-arrow");
    expect(inactiveMarkup).toContain('data-direction="up-right"');
    expect(inactiveMarkup).toContain("lucide-arrow-up-right");

    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="Personal view\. Switch to all users\.")(?=[^>]*aria-pressed="true")(?=[^>]*data-view="personal")[^>]*>/,
    );
    expect(activeMarkup).toMatch(
      /profile-view-option-other[\s\S]*lucide-users[\s\S]*profile-view-option-selected[\s\S]*profile-avatar-fallback[\s\S]*A/,
    );
    expect(activeMarkup).toContain('data-direction="down-left"');
    expect(activeMarkup).toContain("lucide-arrow-down-left");
  });

  it("sizes the My View toggle for footer use", () => {
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
    const css = readFileSync("src/app/styles/shell/profile/my-view-toggle.css", "utf8");

    expect(markup).toContain('width="15"');
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-stack\s*\{[^}]*align-items:\s*flex-start;[^}]*width:\s*2\.56rem;[^}]*height:\s*2\.12rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-option-other\s*\{[^}]*bottom:\s*0;[^}]*left:\s*0;[^}]*width:\s*1\.28rem;[^}]*height:\s*1\.28rem;[^}]*opacity:\s*0\.58;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-option-selected\s*\{[^}]*top:\s*0;[^}]*right:\s*0;[^}]*width:\s*2rem;[^}]*height:\s*2rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger-label\s*\{[^}]*font-size:\s*0\.72rem;[^}]*font-weight:\s*700;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-switch-arrow\s*\{[^}]*width:\s*1rem;[^}]*height:\s*1rem;[^}]*margin-left:\s*auto;[^}]*color:\s*var\(--official-blue\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow,[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\s*\{[^}]*opacity:\s*1;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow\[data-direction="up-right"\],[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\[data-direction="up-right"\]\s*\{[^}]*transform:\s*translate\(1px, -1px\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow\[data-direction="down-left"\],[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\[data-direction="down-left"\]\s*\{[^}]*transform:\s*translate\(-1px, 1px\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover,[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible\s*\{[^}]*background:\s*rgba\(22, 71, 142, 0\.08\);/,
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

    expect(inactiveMarkup).toContain('sidebar-footer-profile" data-collapsed="true"');
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-pressed="false")[^>]*>/,
    );
    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(css).toMatch(
      /\.sidebar-footer-profile\[data-collapsed="true"\] \.sidebar-profile-toggle \.profile-trigger-label\s*\{[^}]*display:\s*none;/,
    );
    expect(css).toMatch(
      /\.sidebar-footer-profile\[data-collapsed="true"\] \.sidebar-profile-toggle \.profile-view-switch-arrow\s*\{[^}]*display:\s*none;/,
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

  it("keeps the local profile fallback as an L bubble without account actions", () => {
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
    expect(markup).not.toContain("Sign out");
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup).not.toContain("Local access");
  });

  it("does not attach account actions to the profile view toggle", () => {
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

    expect(markup).toContain("profile-view-switch");
    expect(markup).not.toContain('aria-label="Profile menu"');
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup.indexOf("sidebar-settings-menu")).toBeLessThan(markup.indexOf("Sign out"));
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
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="All users view\. Switch to personal view\.")(?=[^>]*aria-pressed="false")(?![^>]*aria-disabled)(?![^>]*\sdisabled(?:=|\s|>))[^>]*>/,
    );
    expect(markup).toContain("Switch view");
  });

  it("routes unmatched My View toggles through the notification queue", () => {
    const loaderActions = readFileSync(
      "src/app/hooks/workspace/loader/useAppWorkspaceLoaderActions.ts",
      "utf8",
    );
    const derivedWorkspace = readFileSync("src/app/hooks/useAppWorkspaceDerived.ts", "utf8");

    expect(loaderActions).toContain("isUnmatchedMyViewActive");
    expect(loaderActions).toContain("enqueueTaskEditNotice");
    expect(loaderActions).toContain("No roster member is linked to this account yet.");
    expect(derivedWorkspace).toContain("isUnmatchedMyViewActive");
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
    expect(markup).toContain("sidebar-favorites-heading-label");
    expect(markup).not.toContain("lucide-star");
    expect(markup).toMatch(
      /<div[^>]*class="[^"]*sidebar-favorites-group[^"]*"[\s\S]*?<span class="sidebar-subtab-label">Timeline<\/span>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="sidebar-subtab sidebar-favorite-subtab")[^>]*><span aria-hidden="true" class="sidebar-subtab-icon">[\s\S]*?<\/span><span class="sidebar-subtab-label">Timeline<\/span><\/button>/,
    );
    const favoritesMarkup = markup.slice(
      markup.indexOf("sidebar-favorites-group"),
      markup.indexOf("Dashboard"),
    );
    expect(favoritesMarkup).toContain("sidebar-subtab-icon");
    expect(markup).toMatch(
      /<div class="sidebar-favorites-heading"><span class="sidebar-favorites-heading-label">Favorites<\/span><\/div>/,
    );
    expect(markup).not.toMatch(
      /<div class="[^"]*sidebar-favorites-heading[^"]*tab[^"]*"/,
    );
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-favorites.css", "utf8");

    expect(css).toMatch(
      /\.sidebar-favorites-heading\s*\{[^}]*padding:\s*0\.06rem 0\.42rem 0\.02rem;[^}]*font-size:\s*0\.64rem;/,
    );
    expect(css).toMatch(/\.sidebar-favorites-list\s*\{[^}]*padding-left:\s*0;/);
    expect(css).toMatch(
      /\.sidebar-favorite-subtab\s*\{[^}]*gap:\s*0\.36rem;[^}]*padding-left:\s*0\.42rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group::after\s*\{[^}]*right:\s*0\.72rem;[^}]*bottom:\s*0\.23rem;[^}]*left:\s*0\.72rem;[^}]*height:\s*2px;[^}]*border-radius:\s*999px;[^}]*background:\s*rgba\(15, 28, 52, 0\.16\);/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group:has\(\.sidebar-subtab:hover\)::after,[\s\S]*\.sidebar-favorites-group:has\(\.sidebar-subtab\[data-active="true"\]\)::after\s*\{[^}]*background:\s*var\(--meco-blue\);/,
    );
  });

  it("renders Home, Add, and Fold controls as the top triplet", () => {
    const markup = renderSidebar(
      [
        {
          value: "home",
          label: "Home",
          icon: React.createElement("span"),
          count: 0,
        },
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "home",
      { notificationCount: 2, sessionUser: signedInUser },
    );
    const css = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    const quickIndex = markup.indexOf("sidebar-quick-actions");
    const homeIndex = markup.indexOf("sidebar-quick-action-home");
    const addIndex = markup.indexOf("sidebar-quick-action-add");
    const foldIndex = markup.indexOf("sidebar-quick-action-fold");
    const footerNotificationsIndex = markup.indexOf("sidebar-footer-action-notifications");

    expect(homeIndex).toBeGreaterThan(quickIndex);
    expect(homeIndex).toBeLessThan(addIndex);
    expect(addIndex).toBeLessThan(foldIndex);
    expect(footerNotificationsIndex).toBeGreaterThan(markup.indexOf("sidebar-footer-actions"));
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-home)(?=[^>]*aria-current="page")(?=[^>]*aria-label="Home")(?=[^>]*data-active="true")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-add)(?=[^>]*aria-expanded="false")(?=[^>]*aria-haspopup="menu")(?=[^>]*aria-label="Add new")[^>]*>[\s\S]*<\/button>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Collapse sidebar")[^>]*>/,
    );
    expect(markup).toContain("lucide-panel-left-close");
    expect(markup).toContain("Add task");
    expect(markup).toContain("Add report");
    expect(markup).toContain("Add milestone");
    expect(markup).toContain("Add part");
    expect(markup).toContain("sidebar-quick-action-badge");
    expect(markup).not.toContain('aria-label="Today"');
    expect(css).toMatch(
      /\.sidebar-quick-action\[data-active="true"\]\s*\{[^}]*border-radius:\s*8px;[^}]*background:\s*var\(--meco-blue\);[^}]*color:\s*var\(--official-white\);/,
    );
    expect(css).toMatch(
      /\.page-shell\.dark-mode \.sidebar-quick-action\[data-active="true"\]\s*\{[^}]*background:\s*var\(--meco-blue\);[^}]*color:\s*var\(--official-white\);/,
    );
  });

  it("delegates the notification button to the workspace toast queue", () => {
    const markup = renderSidebar(
      [
        {
          value: "home",
          label: "Home",
          icon: React.createElement("span"),
          count: 0,
        },
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
      ],
      "home",
      {
        notificationCount: 2,
        isNotificationQueueOpen: true,
        sessionUser: signedInUser,
      },
    );

    const source = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const notificationSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarNotificationButton.tsx",
      "utf8",
    );
    const sidebarSource = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");

    expect(markup).toContain("sidebar-footer-action-notifications");
    expect(markup).toContain('aria-label="Notifications (2)"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('data-active="true"');
    expect(markup).not.toContain("sidebar-notification-queue");
    expect(markup).not.toContain("sidebar-notification-tray");
    expect(source).toContain("onNotificationQueueToggle");
    expect(source).toContain("<AppSidebarNotificationButton");
    expect(source).toContain("isOpen={isNotificationQueueOpen}");
    expect(source).toContain("onToggle={onNotificationQueueToggle}");
    expect(notificationSource).toMatch(
      /const handleNotificationQueuePreviewOpen = \(\) => \{[\s\S]*hoverOpenedNotificationQueueRef\.current = true;[\s\S]*onToggle\(\);[\s\S]*\};/,
    );
    expect(notificationSource).toMatch(
      /const handleNotificationQueuePreviewClose = \(\) => \{[\s\S]*if \(!hoverOpenedNotificationQueueRef\.current\) \{[\s\S]*return;[\s\S]*\}[\s\S]*onToggle\(\);/,
    );
    expect(notificationSource).toMatch(
      /const handleNotificationQueueClick = \(\) => \{[\s\S]*if \(hoverOpenedNotificationQueueRef\.current\) \{[\s\S]*return;[\s\S]*\}[\s\S]*onToggle\(\);[\s\S]*\};/,
    );
    expect(notificationSource).toContain("onMouseEnter={handleNotificationQueuePreviewOpen}");
    expect(notificationSource).toContain("onMouseLeave={handleNotificationQueuePreviewClose}");
    expect(notificationSource).toContain("onBlur={handleNotificationQueuePreviewClose}");
    expect(notificationSource).toContain("onFocus={handleNotificationQueueFocus}");
    expect(notificationSource).toContain("onClick={handleNotificationQueueClick}");
    expect(sidebarSource).toContain("onNotificationQueueToggle={onToggleNotificationQueue}");
    expect(source).not.toContain("notificationItems");
    expect(source).not.toContain("sidebar-notification-tray");
  });

  it("does not ship a sidebar-owned notification tray", () => {
    const source = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const notificationSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarNotificationButton.tsx",
      "utf8",
    );
    const appCss = readFileSync("src/app/App.css", "utf8");

    expect(source).not.toContain('<details className="sidebar-notification-menu">');
    expect(source).not.toContain("useState(false)");
    expect(source).not.toContain("setIsNotificationQueueOpen");
    expect(source).not.toContain("sidebar-notification-queue");
    expect(source).not.toContain("sidebar-notification-tray");
    expect(notificationSource).not.toContain("notificationItems");
    expect(notificationSource).not.toContain("sidebar-notification-tray");
    expect(appCss).not.toContain("sidebar-notifications.css");
    expect(existsSync("src/app/styles/shell/sidebar-notifications.css")).toBe(false);
  });

  it("keeps workspace sections closed while Home is active", () => {
    const markup = renderSidebar(
      [
        {
          value: "home",
          label: "Home",
          icon: React.createElement("span"),
          count: 0,
        },
        {
          value: "tasks",
          label: "Tasks",
          icon: React.createElement("span"),
          count: 4,
        },
        {
          value: "worklogs",
          label: "Work logs",
          icon: React.createElement("span"),
          count: 2,
        },
      ],
      "home",
      { sessionUser: signedInUser },
    );

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-home)(?=[^>]*aria-current="page")(?=[^>]*data-active="true")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*data-active="false")(?=[^>]*data-tutorial-target="sidebar-tab-dashboard")[^>]*>/,
    );
    expect(markup).not.toContain('<span class="sidebar-subtab-label">Calendar</span>');
    expect(markup).not.toContain('<span class="sidebar-subtab-label">Activity</span>');
    expect(markup).not.toContain('<span class="sidebar-subtab-label">Metrics</span>');
  });

  it("uses one shared underline for the Home, Add, and Notifications quick actions", () => {
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
