/// <reference types="jest" />

import { existsSync, readFileSync } from "node:fs";
import * as React from "react";

import { renderSidebar, signedInUser } from "./AppSidebar.testUtils";

describe("AppSidebar notifications", () => {
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
