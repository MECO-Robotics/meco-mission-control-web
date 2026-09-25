/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebarPopups } from "@/components/layout/AppSidebarPopups";
import { SidebarProvider, type SidebarState } from "@/components/layout/sidebar/context/SidebarContext";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

function renderPopups(overrides: Partial<SidebarState>) {
  const state: SidebarState = {
    activeTab: "tasks",
    activeSubItemId: null,
    sectionModels: [],
    onSelectTarget: jest.fn(),
    onDisabledSubItemSelect: jest.fn(),
    isCollapsed: false,
    toggleSidebar: jest.fn(),
    projects: [],
    seasons: [],
    selectedProjectId: null,
    selectedSeasonId: null,
    selectedScopeLabel: "All projects",
    canEditSelectedRobot: false,
    onSelectProject: jest.fn(),
    onSelectSeason: jest.fn(),
    onCreateRobot: jest.fn(),
    onCreateSeason: jest.fn(),
    onEditSelectedRobot: jest.fn(),
    popup: { activePanel: null, isOpen: true, top: 0 },
    projectPopupRef: React.createRef<HTMLDivElement>(),
    projectTriggerRef: React.createRef<HTMLButtonElement>(),
    sidebarShellRef: React.createRef<HTMLDivElement>(),
    onProjectTriggerClick: jest.fn(),
    onProjectOptionSelect: jest.fn(),
    onSeasonOptionSelect: jest.fn(),
    onPanelChange: jest.fn(),
    closePopup: jest.fn(),
    sessionUser: null,
    onCreateMilestone: jest.fn(),
    onCreatePart: jest.fn(),
    onCreateQaReport: jest.fn(),
    onCreateTask: jest.fn(),
    onOpenProfileEditor: jest.fn(),
    canSignIn: true,
    handleSignOut: jest.fn(),
    onSignIn: jest.fn(),
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
    onRefreshWorkspace: jest.fn(),
    isNotificationQueueOpen: false,
    notificationCount: 0,
    onToggleNotificationQueue: jest.fn(),
    onHelpSelect: jest.fn(),
    localMode: null,
    onResetDemo: jest.fn(),
    onEnqueueNotification: jest.fn(),
    ...overrides,
  };
  return renderToStaticMarkup(
    React.createElement(SidebarProvider, { value: state }, React.createElement(AppSidebarPopups)),
  );
}

describe("AppSidebar scope", () => {
  it("renders the project and season scope pill below the profile switch", () => {
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
    const profileIndex = markup.indexOf("sidebar-quick-action-profile");
    const scopeIndex = markup.indexOf("sidebar-scope-trigger");

    expect(profileIndex).toBeLessThan(scopeIndex);
    expect(markup).toContain('aria-label="Open project and season selector"');
    expect(markup).toContain('data-tutorial-target="project-select"');
    expect(markup).toContain("2026 Season - Robot 2026");
    expect(markup).toContain("Robot 2026");
    expect(markup).not.toContain("sidebar-season-select");
    expect(markup).not.toContain("sidebar-project-trigger");
  });

  it("renders the scope kind panel before opening a target panel", () => {
    const seasons: SeasonRecord[] = [
      {
        id: "season-1",
        name: "2026 Season",
        type: "season",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
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
    const scopeMarkup = renderPopups({
      popup: { activePanel: null, isOpen: true, top: 0 },
      projects: [robotProject],
      seasons,
      selectedProjectId: robotProject.id,
      selectedSeasonId: "season-1",
    });

    expect(scopeMarkup).toContain("sidebar-scope-popup-shell");
    expect(scopeMarkup).toContain("sidebar-scope-kind-panel");
    expect(scopeMarkup).toContain("Workspace scope");
    expect(scopeMarkup).toContain(">Project</span>");
    expect(scopeMarkup).toContain(">Season</span>");
    expect(scopeMarkup).not.toContain("sidebar-scope-target-panel");
  });

  it("renders only the selected second-stage scope panel", () => {
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
    const scopeMarkup = renderPopups({
      popup: { activePanel: "season", isOpen: true, top: 0 },
      projects: [robotProject],
      seasons,
      selectedProjectId: robotProject.id,
      selectedSeasonId: "season-1",
    });
    const seasonPanelIndex = scopeMarkup.indexOf('data-scope-panel="season"');
    const projectPanelIndex = scopeMarkup.indexOf('data-scope-panel="project"');

    expect(scopeMarkup).toContain("sidebar-scope-popup-shell");
    expect(scopeMarkup).toContain("sidebar-scope-kind-panel");
    expect(scopeMarkup).toContain("sidebar-scope-target-panel");
    expect(seasonPanelIndex).toBeGreaterThan(-1);
    expect(projectPanelIndex).toBe(-1);
    expect(scopeMarkup).toContain("Seasons");
    expect(scopeMarkup).toContain("2027 Season");
    expect(scopeMarkup).toContain("Create new season");
    expect(scopeMarkup).not.toContain("Projects");
    expect(scopeMarkup).not.toContain("All projects");
    expect(css).toContain(".sidebar-scope-option-caret");
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
    expect(markup).toContain('width="13"');
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
});
