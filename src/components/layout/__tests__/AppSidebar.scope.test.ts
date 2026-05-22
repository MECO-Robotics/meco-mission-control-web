/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebarPopups } from "@/components/layout/AppSidebarPopups";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

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
    const footerIndex = markup.indexOf("sidebar-footer-stack");
    const profileIndex = markup.indexOf("sidebar-footer-profile");
    const scopeIndex = markup.indexOf("sidebar-scope-trigger");

    expect(profileIndex).toBeGreaterThan(footerIndex);
    expect(profileIndex).toBeLessThan(scopeIndex);
    expect(scopeIndex).toBeGreaterThan(footerIndex);
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
    const scopeMarkup = renderToStaticMarkup(
      React.createElement(AppSidebarPopups, {
        activeScopePanel: null,
        activeSubItemId: null,
        compactPopupRef: React.createRef<HTMLDivElement>(),
        compactPopupSection: null,
        compactPopupTop: 0,
        getSectionSubItems: () => [],
        isCollapsed: false,
        isProjectPopupOpen: false,
        isScopePopupOpen: true,
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
        setActiveScopePanel: jest.fn(),
      } as React.ComponentProps<typeof AppSidebarPopups>),
    );

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
    const baseProps = {
      activeScopePanel: "season",
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
      setActiveScopePanel: jest.fn(),
    };
    const scopeMarkup = renderToStaticMarkup(
      React.createElement(AppSidebarPopups, {
        ...baseProps,
        isScopePopupOpen: true,
      } as React.ComponentProps<typeof AppSidebarPopups>),
    );
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
