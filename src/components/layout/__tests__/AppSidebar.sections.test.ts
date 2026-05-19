/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";

import type { ProjectRecord } from "@/types/recordsOrganization";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar sections", () => {
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
