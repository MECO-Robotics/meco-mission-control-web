import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppSidebarScopeMenuPopup, type ScopePanelConfig } from "@/components/layout/AppSidebarScopeMenuPopup";
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

const scopePanels: ScopePanelConfig[] = [
  { id: "project", label: "Projects", icon: "layout-grid" },
  { id: "season", label: "Seasons", icon: "calendar-days" },
];

function renderScopeMenu(
  activePanel: any,
  scopePanels: ScopePanelConfig[] = scopePanels,
) {
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
      scopePanels,
    }),
  );
}

describe("AppSidebarScopeMenuPopup", () => {
  it("renders scope panels from configuration", () => {
    const markup = renderScopeMenu("project");

    expect(markup).toContain("Projects");
    expect(markup).toContain("Seasons");
  });

  it("packages season selection as a second-stage scope menu", () => {
    const markup = renderScopeMenu("season");

    expect(markup).toContain('aria-label="Workspace scope"');
    expect(markup).toContain("Seasons");
    expect(markup).toContain("Projects");
    expect(markup).toContain('data-tutorial-target="season-select"');
    expect(markup).toContain("2026 Season");
    expect(markup).toContain("2027 Season");
    expect(markup).toContain("Create new season");
  });

  it("packages season selection with only season panel", () => {
    const markup = renderScopeMenu("season", [{ id: "season", label: "Seasons", icon: "calendar-days" }]);

    expect(markup).toContain("Seasons");
    expect(markup).not.toContain("Projects");
  });

  it("packages project selection with only project panel", () => {
    const markup = renderScopeMenu("project", [{ id: "project", label: "Projects", icon: "layout-grid" }]);

    expect(markup).toContain("Projects");
    expect(markup).not.toContain("Seasons");
  });

  it("places project selection above season selection in the scope stage", () => {
    const markup = renderScopeMenu("season");

    expect(markup.indexOf(">Projects</span>")).toBeLessThan(markup.indexOf(">Seasons</span>"));
  });

  it("packages project selection as a second-stage scope menu", () => {
    const markup = renderScopeMenu("project");

    expect(markup).toContain('aria-label="Workspace scope"');
    expect(markup).toContain("Projects");
    expect(markup).toContain('data-tutorial-target="project-select"');
    expect(markup).toContain("All projects");
    expect(markup).toContain("Robot 2026");
    expect(markup).toContain("Outreach");
    expect(markup).toContain("Add robot");
    expect(markup).toContain("Edit robot name");
  });
});
