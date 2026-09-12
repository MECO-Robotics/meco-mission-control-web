import { readFileSync } from "node:fs";
import { renderSidebar } from "./AppSidebar.testUtils";

describe("flat sidebar navigation", () => {
  it("shows every destination under noninteractive headings", () => {
    const markup = renderSidebar([], "tasks", { taskView: "calendar" });
    expect(markup).toContain("sidebar-quick-action-profile");
    expect(markup).toContain('aria-label="Dashboard"');
    expect(markup).toContain('aria-label="Work"');
    expect(markup).toContain("sidebar-section-heading");
    expect(markup).toContain("sidebar-nav-item-icon");
    expect(markup).not.toContain("sidebar-section-chevron");
    for (const label of ["Tasks", "Schedule", "Robot", "Parts", "People"]) expect(markup).toContain(`>${label}</span>`);
    expect(markup).not.toContain(">Risks</span>");
    expect(markup).not.toContain("workspace-primary-navigation");
  });
  it("keeps destinations directly accessible when folded", () => {
    const markup = renderSidebar([], "tasks", { isCollapsed: true });
    expect(markup).not.toContain("sidebar-subtab-list");
    expect(markup).toContain('aria-label="Expand sidebar"');
    expect(markup).toContain('aria-label="Tasks"');
    expect(markup).toContain('aria-label="Parts"');
    expect(markup).not.toContain("sidebar-section-heading");
  });
  it("keeps unavailable Resources subitems visible and openable", () => {
    const markup = renderSidebar([], "inventory");
    expect(markup).toContain('data-enabled="false"');
    expect(markup).toMatch(/<button(?=[^>]*data-tutorial-target="sidebar-view-resources-parts")(?![^>]*\sdisabled="")[^>]*>/);
    expect(markup).toContain(">Parts</span>");
  });

  it("places Robot in the Work section", () => {
    const markup = renderSidebar([], "tasks");
    const workStart = markup.indexOf('data-tutorial-target="sidebar-tab-work"');
    const robotIndex = markup.indexOf(">Robot</span>");
    const resourcesStart = markup.indexOf('data-tutorial-target="sidebar-tab-resources"');

    expect(robotIndex).toBeGreaterThan(workStart);
    expect(robotIndex).toBeLessThan(resourcesStart);
    expect(markup).not.toContain(">Structure</span>");
  });

  it("greys out Robot until a robot project is selected", () => {
    const markup = renderSidebar([], "tasks");
    expect(markup).toMatch(/<button(?=[^>]*data-tutorial-target="sidebar-view-resources-structure")(?=[^>]*data-robot-disabled="true")(?=[^>]*aria-disabled="true")[^>]*>/);
    const sidebarCss = readFileSync("src/app/styles/shell/sidebar/sidebar-navigation.css", "utf8");
    expect(sidebarCss).toMatch(/\.sidebar-nav-item\[data-robot-disabled="true"\]\s*\{[^}]*opacity:\s*0\.48;[^}]*cursor:\s*not-allowed;/);
  });
});
