/// <reference types="jest" />

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("@/lib/branding", () => ({
  MECO_MAIN_LOGO_HEIGHT: 40,
  MECO_MAIN_LOGO_LIGHT_SRC: "/logo-light.png",
  MECO_MAIN_LOGO_WHITE_SRC: "/logo-white.png",
  MECO_MAIN_LOGO_WIDTH: 120,
  MECO_PROFILE_AVATAR_SIZE: 32,
}));

import { AppTopbar } from "@/components/layout/AppTopbar";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function renderTopbar(
  isNonRobotProject: boolean,
  selectedProject: {
    id: string;
    name: string;
    projectType: "robot" | "operations";
  } = {
    id: "project-1",
    name: "Operations",
    projectType: "operations",
  },
) {
  return renderToStaticMarkup(
    React.createElement(AppTopbar, {
      activeTab: "inventory",
      handleSignOut: jest.fn(),
      inventoryView: "materials",
      isDarkMode: false,
      isLoadingData: false,
      isNonRobotProject,
      isSidebarCollapsed: false,
      loadWorkspace: jest.fn(),
      manufacturingView: "cnc",
      onCreateRobot: jest.fn(),
      onEditSelectedRobot: jest.fn(),
      onSelectProject: jest.fn(),
      projects: [
        {
          id: selectedProject.id,
          seasonId: "season-1",
          name: selectedProject.name,
          projectType: selectedProject.projectType,
          description: "",
          status: "active",
        },
      ],
      selectedProjectId: selectedProject.id,
      sessionUser: null,
      setInventoryView: jest.fn(),
      setManufacturingView: jest.fn(),
      setTaskView: jest.fn(),
      subsystemsLabel: "Workflow",
      taskView: "timeline",
      toggleDarkMode: jest.fn(),
      toggleSidebar: jest.fn(),
    }),
  );
}

describe("AppTopbar", () => {
  it("omits the non-technical inventory subtab for non-robot projects", () => {
    const markup = renderTopbar(true);

    expect(markup).toContain("Documents");
    expect(markup).toContain("Purchases");
    expect(markup).not.toContain("Non-Technical");
  });

  it("offers add robot from the project dropdown", () => {
    const markup = renderTopbar(false);

    expect(markup).toContain("Add robot");
  });

  it("shows an edit robot name button when a robot project is selected", () => {
    const markup = renderTopbar(false, {
      id: "project-robot",
      name: "Robot",
      projectType: "robot",
    });

    expect(markup).toContain("Edit robot name");
  });
});
