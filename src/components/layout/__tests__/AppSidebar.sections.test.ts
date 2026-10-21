import { readFileSync } from "node:fs";
import { renderSidebar } from "./AppSidebar.testUtils";

describe("flat sidebar navigation", () => {
  it("shows every destination under noninteractive headings", () => {
    const markup = renderSidebar([], "tasks", { taskView: "timeline" });
    expect(markup).toContain("sidebar-quick-action-profile");
    expect(markup).toContain('aria-label="Dashboard"');
    expect(markup).toContain('aria-label="Work"');
    expect(markup).toContain("sidebar-section-heading");
    expect(markup).toContain("sidebar-nav-item-icon");
    expect(markup).not.toContain("sidebar-section-chevron");
    for (const label of ["Kanban", "Schedule", "Robot", "Parts", "People", "Teams"]) expect(markup).toContain(`>${label}</span>`);
    expect(markup.indexOf('aria-label="Team"')).toBeLessThan(markup.indexOf('aria-label="Resources"'));
    expect(markup).toContain(">Risks</span>");
    expect(markup).not.toContain("workspace-primary-navigation");
  });
  it("opens Schedule directly without retired view selectors", () => {
    const schedule = renderSidebar([], "tasks", { taskView: "timeline" });
    expect(schedule).toContain('aria-label="Schedule"');
    expect(schedule).not.toContain('aria-label="Schedule views"');
    expect(schedule).not.toContain('aria-label="Calendar"');
    expect(schedule).not.toContain('aria-label="Agenda"');
  });
  it("keeps destinations directly accessible when folded", () => {
    const markup = renderSidebar([], "tasks", { isCollapsed: true });
    expect(markup).not.toContain("sidebar-subtab-list");
    expect(markup).toContain('aria-label="Expand sidebar"');
    expect(markup).toContain('aria-label="Kanban"');
    expect(markup).toContain('aria-label="Parts"');
    expect(markup).not.toContain("sidebar-section-heading");
  });
  it("opens nested view selectors on hover or keyboard focus when folded", () => {
    const markup = renderSidebar([], "worklogs", { isCollapsed: true, worklogsView: "activity" });

    expect(markup).toContain('aria-label="Activity views" class="sidebar-nested-nav sidebar-nested-nav-compact"');
    expect(markup).toContain('<p class="sidebar-nested-nav-title">Activity</p>');
    expect(markup).toContain('aria-label="Work logs"');
    expect(markup).toContain('aria-label="Changes"');
    expect(markup).not.toMatch(/<button[^>]*>Activity<\/button>/);
    expect(markup).toMatch(/<div class="sidebar-nav-group" data-has-compact-subitems="true">[\s\S]*?data-tutorial-target="sidebar-view-work-activity"/);
    expect(markup).toMatch(/<div class="sidebar-nav-group"><button(?=[^>]*data-tutorial-target="sidebar-view-resources-materials")/);

    const sidebarCss = readFileSync("src/app/styles/shell/sidebar/sidebar-navigation.css", "utf8");
    expect(sidebarCss).toContain('.sidebar-nav-group[data-has-compact-subitems="true"]:hover .sidebar-nested-nav-compact');
    expect(sidebarCss).toContain('.sidebar-nav-group[data-has-compact-subitems="true"]:focus-within .sidebar-nested-nav-compact');
    expect(sidebarCss).toMatch(/\.sidebar-nested-nav-title\s*\{[^}]*font-size:\s*0\.7rem;[^}]*pointer-events:\s*none;/);
  });
  it("keeps unavailable Resources subitems visible and openable", () => {
    const markup = renderSidebar([], "inventory");
    expect(markup).toContain('data-enabled="false"');
    expect(markup).toMatch(/<button(?=[^>]*data-tutorial-target="sidebar-view-resources-parts")(?![^>]*\sdisabled="")[^>]*>/);
    expect(markup).toContain(">Parts</span>");
  });

  it("places Robot in the Work section", () => {
    const markup = renderSidebar([], "tasks");
    const workStart = markup.indexOf('aria-label="Work"');
    const robotIndex = markup.indexOf(">Robot</span>");
    const resourcesStart = markup.indexOf('aria-label="Resources"');

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

  it("uses theme-aware colors for nested navigation and its keyboard focus ring", () => {
    const sidebarCss = readFileSync("src/app/styles/shell/sidebar/sidebar-navigation.css", "utf8");
    expect(sidebarCss).toContain("border-left: 1px solid var(--border-base)");
    expect(sidebarCss).toContain("color: var(--text-copy)");
    expect(sidebarCss).toContain("background: var(--meco-soft-blue)");
    expect(sidebarCss).toContain("color: var(--text-title)");
    expect(sidebarCss).toContain("outline: 2px solid var(--status-info-text)");
    expect(sidebarCss).not.toMatch(/var\(--(?:border-subtle|text-secondary|sidebar-active-bg|text-primary|focus-ring),/);
  });

  it("keeps shell collapse immediate and disables remaining chrome transitions for reduced motion", () => {
    const motionCss = readFileSync("src/app/styles/shell/layout/motion-a.css", "utf8");
    const reducedMotionRules = motionCss.split("@media (prefers-reduced-motion: reduce)")[1];
    const frameCss = readFileSync("src/app/styles/shell/layout/frame.css", "utf8");
    const sidebarCss = readFileSync("src/app/styles/shell/sidebar/sidebar-core.css", "utf8");
    expect(frameCss).not.toMatch(/transition:\s*[^;]*padding/);
    expect(sidebarCss).not.toMatch(/transition:\s*[^;]*width/);
    expect(reducedMotionRules).toContain(".app-topbar-brand");
    expect(reducedMotionRules).toContain(".app-topbar-brand-icon");
    expect(reducedMotionRules).toContain("transition: none");
  });
});
