import React from "react";
import { renderSidebar } from "./AppSidebar.testUtils";
import type { NavigationItem } from "@/lib/workspaceNavigation";
const items: NavigationItem[] = ["home", "tasks", "inventory", "roster", "worklogs"].map((value) => ({ value: value as NavigationItem["value"], label: value, icon: React.createElement("span"), count: 0 }));
describe("primary navigation", () => {
  it.each([false, true])("has four labeled destinations with collapsed=%s", (isCollapsed) => {
    const markup = renderSidebar(items, "home", { isCollapsed });
    expect(markup.match(/data-tutorial-target="sidebar-tab-/g)).toHaveLength(4);
    for (const label of ["Home", "Work", "Resources", "Team"]) expect(markup).toContain(`aria-label="${label}"`);
    expect(markup).toMatch(/aria-current="page"[^>]*aria-label="Home"/);
    expect(markup).not.toContain("sidebar-subtab-list");
    expect(markup).not.toContain("sidebar-quick-action-home");
  });
  it("marks Work for schedule and Resources for structure", () => {
    expect(renderSidebar(items, "tasks", { taskView: "calendar" })).toMatch(/aria-current="page"[^>]*aria-label="Work"/);
    expect(renderSidebar(items, "tasks", { taskView: "robot-map" })).toMatch(/aria-current="page"[^>]*aria-label="Resources"/);
  });
  it("keeps account, scope, help and notifications separate", () => {
    const markup = renderSidebar(items, "home");
    for (const label of ["Settings", "Help", "Open project and season selector"]) expect(markup).toContain(`aria-label="${label}"`);
    expect(markup).toContain("Notifications");
  });
});
