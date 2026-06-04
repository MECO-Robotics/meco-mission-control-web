/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppTopbarNavigation } from "@/components/layout/AppTopbarNavigation";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderTopbarNavigation(
  overrides: Partial<React.ComponentProps<typeof AppTopbarNavigation>> = {},
) {
  return renderToStaticMarkup(
    React.createElement(AppTopbarNavigation, {
      activeTab: "tasks",
      inventoryView: "materials",
      isAllProjectsView: false,
      isNonRobotProject: false,
      manufacturingView: "all",
      onSelectTarget: jest.fn(),
      reportsView: "qa",
      rosterView: "workload",
      riskManagementView: "kanban",
      taskView: "queue",
      worklogsView: "logs",
      ...overrides,
    }),
  );
}

describe("AppTopbarNavigation availability", () => {
  it("omits robot-only work views for non-robot project context", () => {
    const markup = renderTopbarNavigation({
      isNonRobotProject: true,
      viewAvailabilityContext: "non-robot-project",
    });

    expect(markup).toContain("Work");
    expect(markup).toContain("Timeline");
    expect(markup).toContain("Tasks");
    expect(markup).not.toContain("Manufacturing");
  });

  it("includes robot-only work views for robot project context", () => {
    const markup = renderTopbarNavigation({
      viewAvailabilityContext: "robot-project",
    });

    expect(markup).toContain("Manufacturing");
  });

  it("omits all inventory views when no project exists", () => {
    const markup = renderTopbarNavigation({
      activeTab: "inventory",
      inventoryView: "materials",
      isAllProjectsView: true,
      viewAvailabilityContext: "no-project",
    });

    expect(markup).toContain("Inventory");
    expect(markup).not.toContain("Materials");
    expect(markup).not.toContain("Parts");
    expect(markup).not.toContain("Purchases");
  });
});
