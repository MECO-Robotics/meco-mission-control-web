/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebarScopeMenuPopup } from "@/components/layout/AppSidebarScopeMenuPopup";
import type { ScopePanelConfig } from "@/components/layout/sidebar/SidebarScopePanel";
import type { ProjectRecord, SeasonRecord } from "@/types/recordsOrganization";
import sidebarCatalog from "@/components/layout/sidebar/sidebarItems.json";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const seasons: SeasonRecord[] = [
  {
    id: "season-2026",
        teamId: "team-1",
    name: "2026 Season",
    type: "season",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  },
  {
    id: "season-2027",
        teamId: "team-1",
    name: "2027 Season",
    type: "season",
    startDate: "2027-01-01",
    endDate: "2027-12-31",
  },
];

const projects: ProjectRecord[] = [
  {
    id: "robot-2026",
    name: "Robot",
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
  const scopePanels = (sidebarCatalog.find((item) => item.id === "scope-panels")?.panels ?? []) as ScopePanelConfig[];
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
  it("renders labels and icons from the scope panel catalog", () => {
    const scopePanels = (sidebarCatalog.find((item) => item.id === "scope-panels")?.panels ?? []) as ScopePanelConfig[];
    const markup = renderToStaticMarkup(
      React.createElement(AppSidebarScopeMenuPopup, {
        activePanel: null,
        canEditSelectedRobot: false,
        onEditSelectedRobot: jest.fn(),
        onPanelChange: jest.fn(),
        onSelectProjectOption: jest.fn(),
        onSelectSeasonOption: jest.fn(),
        projects: [],
        seasons: [],
        selectedProjectId: null,
        selectedSeasonId: null,
        scopePanels,
      }),
    );

    expect(sidebarCatalog).toEqual(expect.any(Array));
    expect(markup).toContain(">Projects</span>");
    expect(markup).toContain(">Seasons</span>");
    expect(markup).toContain("lucide-layout-grid");
    expect(markup).toContain("<svg");
  });

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

    expect(markup.indexOf(">Projects</span>")).toBeLessThan(markup.indexOf(">Seasons</span>"));
  });

  it("packages project selection as a second-stage scope menu", () => {
    const markup = renderScopeMenu("project");

    expect(markup).toContain('aria-label="Workspace scope"');
    expect(markup).toContain("Project");
    expect(markup).toContain('data-tutorial-target="project-select"');
    expect(markup).toContain("All projects");
    expect(markup).toContain("Robot");
    expect(markup).toContain("Outreach");
    expect(markup).toContain("Add robot");
    expect(markup).toContain("Edit robot name");
  });
});
