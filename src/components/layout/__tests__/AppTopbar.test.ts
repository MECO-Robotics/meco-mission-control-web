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
      activeViewLabel: "Timeline",
      handleSignOut: jest.fn(),
      isDarkMode: false,
      isLoadingData: false,
      isSidebarCollapsed: false,
      loadWorkspace: jest.fn(),
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
      toggleDarkMode: jest.fn(),
    }),
  );
}

describe("AppTopbar", () => {
  it("renders season controls in the signed-in profile menu", () => {
    const markup = renderTopbar(undefined, true);

    expect(markup).toContain('data-tutorial-target="season-select"');
    expect(markup).toContain("Create new season");
  });

  it("renders My View as an active topbar filter toggle", () => {
    const markup = renderTopbar(
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
    const markup = renderTopbar();

    expect(markup).toContain('aria-label="Toggle dark mode"');
  });

  it("moves dark mode toggle under profile menu for signed-in users", () => {
    const markup = renderTopbar(undefined, true);

    expect(markup).toContain("profile-menu-item-theme-toggle");
    expect(markup).toContain("Dark mode");
    expect(markup).not.toContain('aria-label="Toggle dark mode"');
  });
});
