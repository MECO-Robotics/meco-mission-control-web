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
  activeTab: "inventory" | "worklogs" | "reports" = "inventory",
  isNonRobotProject: boolean,
  myView: {
    isActive: boolean;
    memberName: string | null;
  } = {
      isActive: false,
      memberName: "Ava Chen",
    },
  isSignedIn = false,
) {
  const sessionUser = isSignedIn
    ? {
      accountId: "account-1",
      authProvider: "google" as const,
      email: "ava.chen@example.com",
      hostedDomain: "meco-robotics.com",
      name: "Ava Chen",
      picture: null,
    }
    : null;

  return renderToStaticMarkup(
    React.createElement(AppTopbar, {
      activeTab,
      handleSignOut: jest.fn(),
      inventoryView: "materials",
      isDarkMode: false,
      isLoadingData: false,
      isNonRobotProject,
      isSidebarCollapsed: false,
      loadWorkspace: jest.fn(),
      manufacturingView: "cnc",
      riskManagementView: "kanban",
      reportsView: "qa",
      onToggleMyView: jest.fn(),
      onCreateSeason: jest.fn(),
      onSelectSeason: jest.fn(),
      seasons: [
        {
          id: "season-1",
          name: "2026 Season",
          type: "season",
          startDate: "2026-01-01",
          endDate: "2026-12-31",
        },
      ],
      selectedSeasonId: "season-1",
      sessionUser,
      isMyViewActive: myView.isActive,
      myViewMemberName: myView.memberName,
      setInventoryView: jest.fn(),
      setManufacturingView: jest.fn(),
      setRiskManagementView: jest.fn(),
      setReportsView: jest.fn(),
      setTaskView: jest.fn(),
      setWorklogsView: jest.fn(),
      subsystemsLabel: "Workflow",
      taskView: "timeline",
      worklogsView: "logs",
      toggleDarkMode: jest.fn(),
    }),
  );
}

describe("AppTopbar", () => {
  it("omits the non-technical inventory subtab for non-robot projects", () => {
    const markup = renderTopbar("inventory", true);

    expect(markup).toContain("Documents");
    expect(markup).toContain("Purchases");
    expect(markup).not.toContain("Non-Technical");
  });

  it("renders season controls in the signed-in profile menu", () => {
    const markup = renderTopbar("inventory", false, undefined, true);

    expect(markup).toContain('data-tutorial-target="season-select"');
    expect(markup).toContain("Create new season");
  });

  it("renders My View as an active topbar filter toggle", () => {
    const markup = renderTopbar(
      "inventory",
      false,
      {
        isActive: true,
        memberName: "Ava Chen",
      },
    );

    expect(markup).toContain('aria-label="Clear My View filter"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("Showing Ava Chen");
    expect(markup).not.toContain(">My View<");
  });

  it("keeps a standalone dark mode button for local access", () => {
    const markup = renderTopbar("inventory", false);

    expect(markup).toContain('aria-label="Toggle dark mode"');
  });

  it("moves dark mode toggle under profile menu for signed-in users", () => {
    const markup = renderTopbar("inventory", false, undefined, true);

    expect(markup).toContain("profile-menu-item-theme-toggle");
    expect(markup).toContain("Dark mode");
    expect(markup).not.toContain('aria-label="Toggle dark mode"');
  });

  it("shows only Logs and Summary in the worklogs top bar", () => {
    const markup = renderTopbar("worklogs", true);

    expect(markup).toContain("Logs");
    expect(markup).toContain("Summary");
    expect(markup).not.toContain("QA");
    expect(markup).not.toContain("Milestone Result");
  });

  it("shows QA and Milestone Results in the reports top bar", () => {
    const markup = renderTopbar("reports", true);

    expect(markup).toContain("QA");
    expect(markup).toContain("Milestone Results");
    expect(markup).not.toContain("Timeline");
  });
});
