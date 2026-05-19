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

  it("clears mouse focus after the sidebar fold button is clicked", () => {
    const source = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");

    expect(source).toMatch(/const handleSidebarFoldClick = \(event: ReactMouseEvent<HTMLButtonElement>\) => \{[\s\S]*toggleSidebar\(\);[\s\S]*event\.currentTarget\.blur\(\);[\s\S]*\};/);
    expect(source).toContain("onToggleSidebar={handleSidebarFoldClick}");
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
    const css = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

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
    expect(css).toMatch(
      /\.sidebar-footer-actions::before\s*\{[^}]*right:\s*0\.72rem;[^}]*top:\s*0\.23rem;[^}]*left:\s*0\.72rem;[^}]*height:\s*2px;[^}]*border-radius:\s*999px;[^}]*background:\s*rgba\(15, 28, 52, 0\.16\);/,
    );
    expect(css).toMatch(
      /\.sidebar-quick-actions\[data-collapsed="true"\]::after,\s*\.sidebar-footer-actions\[data-collapsed="true"\]::before\s*\{[^}]*right:\s*0\.4rem;[^}]*left:\s*0\.4rem;/,
    );
  });

  it("positions Add and Settings menus outside the sidebar clipping boundary", () => {
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");
    const settingsCss = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");

    expect(quickCss).toMatch(
      /\.sidebar-add-menu-panel\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);[^}]*transform:\s*none;/,
    );
    expect(settingsCss).toMatch(
      /\.sidebar-footer-actions \.sidebar-settings-popover\s*\{[^}]*position:\s*fixed;[^}]*left:\s*calc\(var\(--shell-sidebar-width\) \+ 0\.35rem\);/,
    );
  });

  it("opens the Settings menu from hover preview or click state", () => {
    const footerSource = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");
    const settingsCss = readFileSync("src/app/styles/shell/sidebar/sidebar-settings.css", "utf8");
    const settingsSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarSettingsMenu.tsx",
      "utf8",
    );

    expect(footerSource).toContain("<AppSidebarSettingsMenu");
    expect(footerSource).not.toContain("<details");
    expect(footerSource).not.toContain("<summary");
    expect(settingsCss).toMatch(
      /\.sidebar-settings-menu\[data-open="true"\] \.sidebar-settings-popover\s*\{[^}]*display:\s*grid;/,
    );
    expect(settingsCss).not.toContain(".sidebar-settings-menu:hover .sidebar-settings-popover");
    expect(settingsCss).not.toContain(".sidebar-settings-menu[open] .sidebar-settings-popover");
    expect(settingsCss).not.toContain(":focus-within");
    expect(settingsSource).toContain('data-open={isMenuOpen ? "true" : "false"}');
    expect(settingsSource).toContain("onMouseEnter={handleSettingsHover}");
    expect(settingsSource).toContain("onClick={handleSettingsClick}");
    expect(settingsSource).toContain("handleRefreshWorkspaceClick");
    expect(settingsSource).toContain("onRefreshWorkspace()");
    expect(settingsSource).toContain('closest(".sidebar")');
    expect(settingsSource).toContain('addEventListener("mouseleave", closeHoverMenu)');
    expect(settingsSource).toContain('document.addEventListener("pointerdown", dismissOnOutsidePointer)');
    expect(quickCss).toContain(".sidebar-settings-menu:hover > .sidebar-quick-action");
    expect(quickCss).toContain('.sidebar-settings-menu[data-open="true"] > .sidebar-quick-action');
    expect(quickCss).not.toContain(".sidebar-settings-menu[open] > .sidebar-quick-action");
    expect(quickCss).not.toContain(":focus-within");
  });

  it("opens the Add menu from hover preview or click state", () => {
    const quickSource = readFileSync("src/components/layout/AppSidebarQuickActions.tsx", "utf8");
    const addSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarAddMenu.tsx",
      "utf8",
    );
    const quickCss = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    expect(quickSource).toContain("<AppSidebarAddMenu");
    expect(quickSource).not.toContain("<details");
    expect(quickSource).not.toContain("<summary");
    expect(addSource).toContain('data-open={isAddMenuOpen ? "true" : "false"}');
    expect(addSource).toContain("onMouseEnter={handleAddHover}");
    expect(addSource).toContain("onClick={handleAddClick}");
    expect(addSource).toContain('closest(".sidebar")');
    expect(addSource).toContain('addEventListener("mouseleave", closeHoverMenu)');
    expect(addSource).toContain('document.addEventListener("pointerdown", dismissOnOutsidePointer)');
    expect(addSource).toContain("handleAddActionSelect");
    expect(quickCss).toContain('.sidebar-add-menu[data-open="true"] > .sidebar-quick-action');
    expect(quickCss).toContain('.sidebar-add-menu:not([data-open="true"]) .sidebar-add-menu-panel');
    expect(quickCss).not.toContain(".sidebar-add-menu[open]");
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
