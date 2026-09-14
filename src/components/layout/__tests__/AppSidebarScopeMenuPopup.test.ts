/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebarScopeMenuPopup } from "@/components/layout/AppSidebarScopeMenuPopup";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const seasons: SeasonRecord[] = [
  {
    id: "season-2026",
    name: "2026 Season",
    type: "season",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "season-2027",
    name: "2027 Season",
    type: "season",
    startDate: "2027-01-01",
    endDate: "2027-12-31",
  },
];

const projects: ProjectRecord[] = [
  {
    id: "robot-2026",
    name: "Robot 2026",
    projectType: "robot",
    seasonId: "season-2026",
    description: "Competition robot",
    status: "active",
  },
  {
    id: "outreach-2026",
    name: "Outreach",
    projectType: "outreach",
    seasonId: "season-2026",
    description: "Community work",
    status: "active",
  },
];

function renderScopeMenu(activePanel: "season" | "project") {
  return renderToStaticMarkup(
    React.createElement(AppSidebarScopeMenuPopup, {
      activePanel,
      canEditSelectedRobot: true,
      onEditSelectedRobot: jest.fn(),
      onPanelChange: jest.fn(),
      onSelectProjectOption: jest.fn(),
      onSelectSeasonOption: jest.fn(),
      projects,
      seasons,
      selectedProjectId: "robot-2026",
      selectedSeasonId: "season-2026",
    }),
  );
}

describe("AppSidebarScopeMenuPopup", () => {
  it("packages season selection as a second-stage scope menu", () => {
    const markup = renderScopeMenu("season");

    expect(markup).toContain('aria-label="Workspace scope"');
    expect(markup).toContain("Season");
    expect(markup).toContain("Project");
    expect(markup).toContain('data-tutorial-target="season-select"');
    expect(markup).toContain("2026 Season");
    expect(markup).toContain("2027 Season");
    expect(markup).toContain("Create new season");
  });

  it("places project selection above season selection in the scope stage", () => {
    const markup = renderScopeMenu("season");

    expect(markup.indexOf(">Project</span>")).toBeLessThan(markup.indexOf(">Season</span>"));
  });

  it("packages project selection as a second-stage scope menu", () => {
    const markup = renderScopeMenu("project");

    expect(markup).toContain('aria-label="Workspace scope"');
    expect(markup).toContain("Project");
    expect(markup).toContain('data-tutorial-target="project-select"');
    expect(markup).toContain("All projects");
    expect(markup).toContain("Robot 2026");
    expect(markup).toContain("Outreach");
    expect(markup).toContain("Add robot");
    expect(markup).toContain("Edit robot name");
  });
});
