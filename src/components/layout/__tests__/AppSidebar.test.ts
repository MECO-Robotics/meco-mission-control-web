/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppSidebar } from "@/components/layout/AppSidebar";
import type { ProjectRecord } from "@/types/recordsOrganization";
import type { NavigationItem, ViewTab } from "@/lib/workspaceNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderSidebar(
  items: NavigationItem[],
  activeTab: ViewTab = "reports",
  options?: {
    inventoryView?: "materials" | "parts" | "part-mappings" | "purchases";
    projects?: ProjectRecord[];
    riskManagementView?: "kanban" | "metrics";
    selectedProjectId?: string | null;
    taskView?: "calendar" | "timeline" | "queue" | "milestones";
  },
) {
  return renderToStaticMarkup(
    React.createElement(AppSidebar, {
      activeTab,
      inventoryView: options?.inventoryView ?? "materials",
      items,
      isCollapsed: false,
      onCreateRobot: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onSelectProject: jest.fn(),
      onSelectTarget: jest.fn(),
      projects: options?.projects ?? [],
      reportsView: "qa",
      rosterView: "directory",
      riskManagementView: options?.riskManagementView ?? "kanban",
      selectedProjectId: options?.selectedProjectId ?? null,
      taskView: options?.taskView ?? "queue",
      toggleSidebar: jest.fn(),
      worklogsView: "logs",
    }),
  );
}

describe("AppSidebar", () => {
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

  it("renders Readiness with attention, milestones, subsystems, and risks", () => {
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
    expect(markup).toContain("Attention");
    expect(markup).toContain("Milestones");
    expect(markup).toContain("Subsystems");
    expect(markup).toContain("Risks");
  });

  it("renders Config with robot model, part mappings, and directory", () => {
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
      "inventory",
      {
        inventoryView: "part-mappings",
        projects: [robotProject],
        selectedProjectId: robotProject.id,
      },
    );

    expect(markup).toContain("Config");
    expect(markup).toContain("Robot model");
    expect(markup).toContain("Part mappings");
    expect(markup).toContain("Directory");
  });
});
