/// <reference types="jest" />

import { readFileSync } from "node:fs";
import * as React from "react";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar chrome", () => {
  it("renders the top triplet as Home, Add, and Fold with profile above scope", () => {
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
    const quickIndex = markup.indexOf("sidebar-quick-actions");
    const homeIndex = markup.indexOf("sidebar-quick-action-home");
    const addIndex = markup.indexOf("sidebar-quick-action-add");
    const foldIndex = markup.indexOf("sidebar-quick-action-fold");
    const footerIndex = markup.indexOf("sidebar-footer-stack");
    const profileIndex = markup.indexOf("sidebar-footer-profile");
    const scopeIndex = markup.indexOf("sidebar-scope-trigger");

    expect(homeIndex).toBeGreaterThan(quickIndex);
    expect(homeIndex).toBeLessThan(addIndex);
    expect(addIndex).toBeLessThan(foldIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Collapse sidebar")[^>]*>[\s\S]*lucide-panel-left-close[\s\S]*<\/button>/,
    );
    expect(markup).not.toContain("sidebar-profile-fold-button");
    expect(profileIndex).toBeGreaterThan(footerIndex);
    expect(profileIndex).toBeLessThan(scopeIndex);
    expect(markup.indexOf("profile-view-switch")).toBeGreaterThan(profileIndex);
    expect(markup).not.toContain('<span class="sidebar-tab-label">Collapse sidebar</span>');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Refresh workspace");
    expect(markup).toContain("Sign out");
    expect(markup).not.toContain("profile-menu-popover");
    expect(markup).not.toContain("profile-menu-context-picker");
  });

  it("keeps the folded sidebar expand button in the top triplet", () => {
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
        isCollapsed: true,
        sessionUser: signedInUser,
      },
    );

    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Expand sidebar")[^>]*>[\s\S]*lucide-panel-left-open[\s\S]*<\/button>/,
    );
    expect(markup.indexOf("sidebar-quick-action-fold")).toBeGreaterThan(markup.indexOf("sidebar-quick-action-add"));
    expect(markup).not.toContain("sidebar-profile-fold-button");
  });

  it("adds edge gradient hints for vertical sidebar scrolling", () => {
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
    const sidebarSource = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");
    const hookSource = readFileSync("src/components/layout/sidebar/useSidebarScrollHints.ts", "utf8");
    const shellCss = readFileSync("src/app/styles/shell.css", "utf8");
    const hintCss = readFileSync("src/app/styles/shell/sidebar-profile.css", "utf8");

    expect(markup).toContain('data-scroll-bottom-hint="false"');
    expect(markup).toContain('data-scroll-top-hint="false"');
    expect(sidebarSource).toContain("useSidebarScrollHints()");
    expect(sidebarSource).toContain("ref={sidebarScrollRef}");
    expect(hookSource).toContain("const SCROLL_EDGE_THRESHOLD = 4");
    expect(hookSource).toContain('element.addEventListener("scroll", scheduleUpdate, { passive: true })');
    expect(hookSource).toContain("new ResizeObserver(scheduleUpdate)");
    expect(hookSource).toContain("new MutationObserver(scheduleUpdate)");
    expect(shellCss).toContain('@import url("./shell/sidebar-profile.css");');
    expect(hintCss).toMatch(
      /\.sidebar-shell::before,\s*\.sidebar-shell::after\s*\{[^}]*--sidebar-scroll-edge-pad:\s*1rem;[^}]*position:\s*absolute;[^}]*height:\s*var\(--sidebar-scroll-edge-pad\);[^}]*pointer-events:\s*none;[^}]*opacity:\s*0;/,
    );
    expect(hintCss).toMatch(
      /\.sidebar-shell::before\s*\{[^}]*top:\s*0;[^}]*linear-gradient\(\s*to bottom,[^}]*color-mix\(in srgb, var\(--bg-panel\) 98%, transparent\) 40%,[^}]*color-mix\(in srgb, var\(--bg-panel\) 92%, transparent\) 70%,/,
    );
    expect(hintCss).toMatch(
      /\.sidebar-shell::after\s*\{[^}]*bottom:\s*0;[^}]*linear-gradient\(\s*to top,[^}]*color-mix\(in srgb, var\(--bg-panel\) 98%, transparent\) 40%,[^}]*color-mix\(in srgb, var\(--bg-panel\) 92%, transparent\) 70%,/,
    );
    expect(hintCss).toMatch(
      /\.sidebar-shell\[data-scroll-top-hint="true"\]::before,\s*\.sidebar-shell\[data-scroll-bottom-hint="true"\]::after\s*\{[^}]*opacity:\s*1;/,
    );
  });

  it("renders Settings, Help, and Notifications as the bottom triplet", () => {
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
    const footerActionsIndex = markup.indexOf("sidebar-footer-actions");
    const settingsIndex = markup.indexOf("sidebar-settings-menu");
    const helpIndex = markup.indexOf("sidebar-footer-action-help");
    const notificationsIndex = markup.indexOf("sidebar-footer-action-notifications");

    expect(settingsIndex).toBeGreaterThan(footerActionsIndex);
    expect(settingsIndex).toBeLessThan(helpIndex);
    expect(helpIndex).toBeLessThan(notificationsIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-settings)(?=[^>]*aria-label="Settings")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-help)(?=[^>]*aria-label="Help")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-footer-action-notifications)(?=[^>]*aria-label="Notifications")[^>]*>/,
    );
    expect(markup).toContain('aria-label="Settings menu"');
    expect(markup).toContain("Theme mode");
    expect(markup).toContain("Refresh workspace");
    expect(markup).toContain("Sign out");
    expect(markup).toContain("sidebar-settings-menu-value");
    expect(markup).toContain("lucide-settings");
    expect(markup).toContain("lucide-refresh-cw");
    expect(markup).toContain("lucide-log-out");
    expect(markup).toContain("lucide-bell");

  });

  it("keeps the bottom triplet icon-only when the sidebar is folded", () => {
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
        isCollapsed: true,
        sessionUser: signedInUser,
      },
    );
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");
    const settingsIndex = markup.indexOf("sidebar-settings-collapsed-trigger");
    const helpIndex = markup.indexOf("sidebar-help-collapsed-trigger");
    const notificationsIndex = markup.indexOf("sidebar-footer-action-notifications");

    expect(settingsIndex).toBeGreaterThan(-1);
    expect(settingsIndex).toBeLessThan(helpIndex);
    expect(helpIndex).toBeLessThan(notificationsIndex);
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-settings-collapsed-trigger)(?=[^>]*aria-label="Settings")[^>]*>/,
    );
    expect(markup).not.toContain('<span class="sidebar-tab-label">Settings</span>');
    expect(markup).not.toContain('<span class="sidebar-tab-label">Help</span>');
    expect(css).toMatch(
      /\.sidebar-settings-menu-collapsed \.sidebar-settings-popover\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);/,
    );
  });
});
