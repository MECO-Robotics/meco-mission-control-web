/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebarPopups } from "@/components/layout/AppSidebarPopups";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar scope", () => {
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
});
