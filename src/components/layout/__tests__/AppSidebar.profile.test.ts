/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar profile switch", () => {
  it("renders My View as a stacked switch with the alternate view on the left", () => {
    const inactiveMarkup = renderSidebar(
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
    const activeMarkup = renderSidebar(
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
        isMyViewActive: true,
        sessionUser: signedInUser,
      },
    );

    expect(inactiveMarkup).toContain("profile-view-switch sidebar-profile-toggle");
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="All users view\. Switch to personal view\.")(?=[^>]*aria-pressed="false")(?=[^>]*data-view="all")[^>]*>/,
    );
    expect(inactiveMarkup).toMatch(
      /profile-view-option-other[\s\S]*profile-avatar-fallback[\s\S]*A[\s\S]*profile-view-option-selected[\s\S]*lucide-users/,
    );
    expect(inactiveMarkup).toContain("Switch view");
    expect(inactiveMarkup).toContain("profile-view-switch-arrow");
    expect(inactiveMarkup).toContain('data-direction="up-right"');
    expect(inactiveMarkup).toContain("lucide-arrow-up-right");

    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="Personal view\. Switch to all users\.")(?=[^>]*aria-pressed="true")(?=[^>]*data-view="personal")[^>]*>/,
    );
    expect(activeMarkup).toMatch(
      /profile-view-option-other[\s\S]*lucide-users[\s\S]*profile-view-option-selected[\s\S]*profile-avatar-fallback[\s\S]*A/,
    );
    expect(activeMarkup).toContain('data-direction="down-left"');
    expect(activeMarkup).toContain("lucide-arrow-down-left");
  });

  it("sizes the My View toggle for footer use", () => {
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
    const css = readFileSync("src/app/styles/shell/profile/my-view-toggle.css", "utf8");

    expect(markup).toContain('width="15"');
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-stack\s*\{[^}]*align-items:\s*flex-start;[^}]*width:\s*2\.56rem;[^}]*height:\s*2\.12rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-option-other\s*\{[^}]*bottom:\s*0;[^}]*left:\s*0;[^}]*width:\s*1\.28rem;[^}]*height:\s*1\.28rem;[^}]*opacity:\s*0\.58;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-option-selected\s*\{[^}]*top:\s*0;[^}]*right:\s*0;[^}]*width:\s*2rem;[^}]*height:\s*2rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger-label\s*\{[^}]*font-size:\s*0\.72rem;[^}]*font-weight:\s*700;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-view-switch-arrow\s*\{[^}]*width:\s*1rem;[^}]*height:\s*1rem;[^}]*margin-left:\s*auto;[^}]*color:\s*var\(--official-blue\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow,[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\s*\{[^}]*opacity:\s*1;/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow\[data-direction="up-right"\],[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\[data-direction="up-right"\]\s*\{[^}]*transform:\s*translate\(1px, -1px\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover \.profile-view-switch-arrow\[data-direction="down-left"\],[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible \.profile-view-switch-arrow\[data-direction="down-left"\]\s*\{[^}]*transform:\s*translate\(-1px, 1px\);/,
    );
    expect(css).toMatch(
      /\.sidebar-profile-toggle \.profile-trigger:hover,[\s\S]*\.sidebar-profile-toggle \.profile-trigger:focus-visible\s*\{[^}]*background:\s*rgba\(22, 71, 142, 0\.08\);/,
    );
  });

  it("shows only the active profile toggle state when the sidebar is folded", () => {
    const inactiveMarkup = renderSidebar(
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
        isCollapsed: true,
        sessionUser: signedInUser,
      },
    );
    const activeMarkup = renderSidebar(
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
        isCollapsed: true,
        isMyViewActive: true,
        sessionUser: signedInUser,
      },
    );
    const css = readFileSync("src/app/styles/shell/profile/my-view-toggle.css", "utf8");

    expect(inactiveMarkup).toContain('sidebar-footer-profile" data-collapsed="true"');
    expect(inactiveMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-pressed="false")[^>]*>/,
    );
    expect(activeMarkup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-pressed="true")[^>]*>/,
    );
    expect(css).toMatch(
      /\.sidebar-footer-profile\[data-collapsed="true"\] \.sidebar-profile-toggle \.profile-trigger-label\s*\{[^}]*display:\s*none;/,
    );
    expect(css).toMatch(
      /\.sidebar-footer-profile\[data-collapsed="true"\] \.sidebar-profile-toggle \.profile-view-switch-arrow\s*\{[^}]*display:\s*none;/,
    );
  });

  it("uses an L avatar bubble for local dev-bypass profile state", () => {
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
        isMyViewActive: true,
        myViewMemberName: "Local Dev",
        sessionUser: {
          accountId: "local-dev",
          authProvider: "email",
          email: "dev@meco-robotics.com",
          hostedDomain: "meco-robotics.com",
          name: "Development User",
          picture: null,
        },
      },
    );

    expect(markup).toContain("profile-avatar-fallback");
    expect(markup).toContain(">L</span>");
  });

  it("keeps the local profile fallback as an L bubble with a settings sign-in action", () => {
    const markup = renderSidebar([
      {
        value: "tasks",
        label: "Tasks",
        icon: React.createElement("span"),
        count: 4,
      },
    ]);

    expect(markup).toContain('aria-label="Local dev profile"');
    expect(markup).toContain("app-topbar-local-avatar");
    expect(markup).toContain(">L</span>");
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("lucide-log-in");
    expect(markup).not.toContain("Sign out");
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup).not.toContain("Local access");
  });

  it("does not attach account actions to the profile view toggle", () => {
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

    expect(markup).toContain("profile-view-switch");
    expect(markup).not.toContain('aria-label="Profile menu"');
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup.indexOf("sidebar-settings-menu")).toBeLessThan(markup.indexOf("Sign out"));
  });

  it("keeps the profile hover target enabled when My View has no roster match", () => {
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
        myViewMemberName: null,
        sessionUser: signedInUser,
      },
    );

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*profile-trigger-view-switch)(?=[^>]*aria-label="All users view\. Switch to personal view\.")(?=[^>]*aria-pressed="false")(?![^>]*aria-disabled)(?![^>]*\sdisabled(?:=|\s|>))[^>]*>/,
    );
    expect(markup).toContain("Switch view");
  });

  it("routes unmatched My View toggles through the notification queue", () => {
    const loaderActions = readFileSync(
      "src/app/hooks/workspace/loader/useAppWorkspaceLoaderActions.ts",
      "utf8",
    );
    const derivedWorkspace = readFileSync("src/app/hooks/useAppWorkspaceDerived.ts", "utf8");

    expect(loaderActions).toContain("isUnmatchedMyViewActive");
    expect(loaderActions).toContain("enqueueTaskEditNotice");
    expect(loaderActions).toContain("No roster member is linked to this account yet.");
    expect(derivedWorkspace).toContain("isUnmatchedMyViewActive");
  });
});
