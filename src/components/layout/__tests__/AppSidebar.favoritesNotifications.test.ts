/// <reference types="jest" />

import { existsSync, readFileSync } from "node:fs";
import * as React from "react";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar favorites and notifications", () => {
  it("renders Favorites above Dashboard as an expanded section", () => {
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
          count: 2,
        },
      ],
      "tasks",
      {
        favoriteViewIds: ["tasks-timeline"],
        taskView: "timeline",
      },
    );

    expect(markup.indexOf("Favorites")).toBeGreaterThan(-1);
    expect(markup.indexOf("Favorites")).toBeLessThan(markup.indexOf("Dashboard"));
    expect(markup).toContain("sidebar-favorites-heading-label");
    expect(markup).not.toContain("lucide-star");
    expect(markup).toMatch(
      /<div[^>]*class="[^"]*sidebar-favorites-group[^"]*"[\s\S]*?<span class="sidebar-subtab-label">Timeline<\/span>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="sidebar-subtab sidebar-favorite-subtab")[^>]*><span aria-hidden="true" class="sidebar-subtab-icon">[\s\S]*?<\/span><span class="sidebar-subtab-label">Timeline<\/span><\/button>/,
    );
    const favoritesMarkup = markup.slice(
      markup.indexOf("sidebar-favorites-group"),
      markup.indexOf("Dashboard"),
    );
    expect(favoritesMarkup).toContain("sidebar-subtab-icon");
    expect(markup).toMatch(
      /<div class="sidebar-favorites-heading"><span class="sidebar-favorites-heading-label">Favorites<\/span><\/div>/,
    );
    expect(markup).not.toMatch(
      /<div class="[^"]*sidebar-favorites-heading[^"]*tab[^"]*"/,
    );
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-favorites.css", "utf8");

    expect(css).toMatch(
      /\.sidebar-favorites-heading\s*\{[^}]*padding:\s*0\.06rem 0\.42rem 0\.02rem;[^}]*font-size:\s*0\.64rem;/,
    );
    expect(css).toMatch(/\.sidebar-favorites-list\s*\{[^}]*padding-left:\s*0;/);
    expect(css).toMatch(
      /\.sidebar-favorite-subtab\s*\{[^}]*gap:\s*0\.36rem;[^}]*padding-left:\s*0\.42rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group::after\s*\{[^}]*right:\s*0\.72rem;[^}]*bottom:\s*0\.23rem;[^}]*left:\s*0\.72rem;[^}]*height:\s*2px;[^}]*border-radius:\s*999px;[^}]*background:\s*rgba\(15, 28, 52, 0\.16\);/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group:has\(\.sidebar-subtab:hover\)::after,[\s\S]*\.sidebar-favorites-group:has\(\.sidebar-subtab\[data-active="true"\]\)::after\s*\{[^}]*background:\s*var\(--meco-blue\);/,
    );
  });

  it("keeps favorite icons visible with a compact separator when folded", () => {
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
          count: 2,
        },
      ],
      "tasks",
      {
        favoriteViewIds: ["tasks-timeline"],
        isCollapsed: true,
        taskView: "timeline",
      },
    );
    const css = readFileSync("src/app/styles/shell/sidebar/sidebar-favorites.css", "utf8");
    const favoritesIndex = markup.indexOf("sidebar-favorites-group");
    const dashboardIndex = markup.indexOf('data-tutorial-target="sidebar-tab-dashboard"');

    expect(favoritesIndex).toBeGreaterThan(-1);
    expect(favoritesIndex).toBeLessThan(dashboardIndex);
    expect(markup).toContain('data-collapsed="true"');
    expect(markup).toContain('aria-label="Timeline"');
    expect(markup).toMatch(
      /<button(?=[^>]*class="sidebar-subtab sidebar-favorite-subtab")(?=[^>]*title="Timeline")[^>]*>[\s\S]*sidebar-subtab-icon[\s\S]*<\/button>/,
    );
    expect(markup).toMatch(
      /<div class="sidebar-favorites-heading"><span class="sidebar-favorites-heading-label">Fav<\/span><\/div>/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\]\s*\{[^}]*align-items:\s*center;[^}]*width:\s*100%;[^}]*box-sizing:\s*border-box;[^}]*padding:\s*0 0\.4rem 0\.58rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\]::after\s*\{[^}]*right:\s*0\.4rem;[^}]*left:\s*0\.4rem;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\] \.sidebar-favorites-heading\s*\{[^}]*font-size:\s*0\.58rem;[^}]*text-align:\s*center;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\] \.sidebar-favorites-list\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*width:\s*100%;[^}]*padding-left:\s*0;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\] \.sidebar-favorite-subtab\s*\{[^}]*align-self:\s*center;[^}]*justify-content:\s*center;[^}]*width:\s*1\.9rem;[^}]*flex:\s*0 0 1\.9rem;[^}]*height:\s*1\.9rem;[^}]*margin-inline:\s*auto;[^}]*border-radius:\s*8px;/,
    );
    expect(css).toMatch(
      /\.sidebar-favorites-group\[data-collapsed="true"\] \.sidebar-subtab-label\s*\{[^}]*display:\s*none;/,
    );
  });

  it("renders Home, Add, and Fold controls as the top triplet", () => {
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
      ],
      "home",
      { notificationCount: 2, sessionUser: signedInUser },
    );
    const css = readFileSync("src/app/styles/shell/sidebar-quick-actions.css", "utf8");

    const quickIndex = markup.indexOf("sidebar-quick-actions");
    const homeIndex = markup.indexOf("sidebar-quick-action-home");
    const addIndex = markup.indexOf("sidebar-quick-action-add");
    const foldIndex = markup.indexOf("sidebar-quick-action-fold");
    const footerNotificationsIndex = markup.indexOf("sidebar-footer-action-notifications");

    expect(homeIndex).toBeGreaterThan(quickIndex);
    expect(homeIndex).toBeLessThan(addIndex);
    expect(addIndex).toBeLessThan(foldIndex);
    expect(footerNotificationsIndex).toBeGreaterThan(markup.indexOf("sidebar-footer-actions"));
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-home)(?=[^>]*aria-current="page")(?=[^>]*aria-label="Home")(?=[^>]*data-active="true")[^>]*>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-add)(?=[^>]*aria-expanded="false")(?=[^>]*aria-haspopup="menu")(?=[^>]*aria-label="Add new")[^>]*>[\s\S]*<\/button>/,
    );
    expect(markup).toMatch(
      /<button(?=[^>]*class="[^"]*sidebar-quick-action[^"]*sidebar-quick-action-fold)(?=[^>]*aria-label="Collapse sidebar")[^>]*>/,
    );
    expect(markup).toContain("lucide-panel-left-close");
    expect(markup).toContain("Add task");
    expect(markup).toContain("Add report");
    expect(markup).toContain("Add milestone");
    expect(markup).toContain("Add part");
    expect(markup).toContain("sidebar-quick-action-badge");
    expect(markup).not.toContain('aria-label="Today"');
    expect(css).toMatch(
      /\.sidebar-quick-action\[data-active="true"\]\s*\{[^}]*border-radius:\s*8px;[^}]*background:\s*var\(--meco-blue\);[^}]*color:\s*var\(--official-white\);/,
    );
    expect(css).toMatch(
      /\.page-shell\.dark-mode \.sidebar-quick-action\[data-active="true"\]\s*\{[^}]*background:\s*var\(--meco-blue\);[^}]*color:\s*var\(--official-white\);/,
    );
  });

  it("delegates the notification button to the workspace toast queue", () => {
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
      ],
      "home",
      {
        notificationCount: 2,
        isNotificationQueueOpen: true,
        sessionUser: signedInUser,
      },
    );

    const source = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const notificationSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarNotificationButton.tsx",
      "utf8",
    );
    const sidebarSource = readFileSync("src/components/layout/AppSidebar.tsx", "utf8");

    expect(markup).toContain("sidebar-footer-action-notifications");
    expect(markup).toContain('aria-label="Notifications (2)"');
    expect(markup).toContain('aria-expanded="true"');
    expect(markup).toContain('data-active="true"');
    expect(markup).not.toContain("sidebar-notification-queue");
    expect(markup).not.toContain("sidebar-notification-tray");
    expect(source).toContain("onNotificationQueueToggle");
    expect(source).toContain("<AppSidebarNotificationButton");
    expect(source).toContain("isOpen={isNotificationQueueOpen}");
    expect(source).toContain("onToggle={onNotificationQueueToggle}");
    expect(notificationSource).toMatch(
      /const handleNotificationQueuePreviewOpen = \(\) => \{[\s\S]*hoverOpenedNotificationQueueRef\.current = true;[\s\S]*onToggle\(\);[\s\S]*\};/,
    );
    expect(notificationSource).toMatch(
      /const handleNotificationQueuePreviewClose = \(\) => \{[\s\S]*if \(!hoverOpenedNotificationQueueRef\.current\) \{[\s\S]*return;[\s\S]*\}[\s\S]*onToggle\(\);/,
    );
    expect(notificationSource).toMatch(
      /const handleNotificationQueueClick = \(\) => \{[\s\S]*if \(hoverOpenedNotificationQueueRef\.current\) \{[\s\S]*return;[\s\S]*\}[\s\S]*onToggle\(\);[\s\S]*\};/,
    );
    expect(notificationSource).toContain("onMouseEnter={handleNotificationQueuePreviewOpen}");
    expect(notificationSource).toContain("onMouseLeave={handleNotificationQueuePreviewClose}");
    expect(notificationSource).toContain("onBlur={handleNotificationQueuePreviewClose}");
    expect(notificationSource).not.toContain("handleNotificationQueueFocus");
    expect(notificationSource).not.toContain("onFocus=");
    expect(notificationSource).toContain("onClick={handleNotificationQueueClick}");
    expect(sidebarSource).toContain("onNotificationQueueToggle={onToggleNotificationQueue}");
    expect(source).not.toContain("notificationItems");
    expect(source).not.toContain("sidebar-notification-tray");
  });

  it("does not ship a sidebar-owned notification tray", () => {
    const source = readFileSync("src/components/layout/AppSidebarProjectFooter.tsx", "utf8");
    const notificationSource = readFileSync(
      "src/components/layout/sidebar/AppSidebarNotificationButton.tsx",
      "utf8",
    );
    const appCss = readFileSync("src/app/App.css", "utf8");

    expect(source).not.toContain('<details className="sidebar-notification-menu">');
    expect(source).not.toContain("useState(false)");
    expect(source).not.toContain("setIsNotificationQueueOpen");
    expect(source).not.toContain("sidebar-notification-queue");
    expect(source).not.toContain("sidebar-notification-tray");
    expect(notificationSource).not.toContain("notificationItems");
    expect(notificationSource).not.toContain("sidebar-notification-tray");
    expect(appCss).not.toContain("sidebar-notifications.css");
    expect(existsSync("src/app/styles/shell/sidebar-notifications.css")).toBe(false);
  });
});
