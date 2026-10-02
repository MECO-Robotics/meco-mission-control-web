import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { TeamsView } from "../views/TeamsView";

it("derives team workload for all-project groups and excludes archived work from active metrics", () => {
  const bootstrap = createBootstrap();
  bootstrap.members[0].plannedWeeklyAttendanceHours = 6;
  bootstrap.responsibleGroups = [
    { id: "group-all", seasonId: "season-2026", name: "All Projects", projectIds: [], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: ["lead-1"], isArchived: false },
    { id: "group-secondary", seasonId: "season-2026", name: "Programming", projectIds: [], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: [], isArchived: false },
    { id: "group-old", seasonId: "season-2026", name: "Archived Team", projectIds: ["project-a"], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: [], isArchived: true },
  ];
  bootstrap.tasks = [{ ...bootstrap.tasks[0], responsibleGroupId: "group-all", ownerId: "lead-1", estimatedHours: 6, actualHours: 1, isBlocked: true, dueDate: "2026-01-01" }];
  const html = renderToStaticMarkup(createElement(TeamsView, { bootstrap, selectedSeasonId: "season-2026", selectedProjectId: "project-a", onRefresh: async () => undefined, handleUnauthorized: () => undefined, onOpenTask: () => undefined, onOpenMember: () => undefined, onError: () => undefined }));

  expect(html).toContain("All Projects");
  expect(html).toContain("Archived Team");
  expect(html).toContain("estimated hours remaining");
  expect(html).toContain("5.0h");
  expect(html).toContain("blocked tasks");
  expect(html).toContain("overdue tasks");
  expect(html).toContain('aria-label="0 open, 1 blocked, 0 overdue, and 0 completed tasks"');
  expect(html).toContain('class="is-blocked"><strong>1</strong> blocked');
  expect(html).toContain('class="is-overdue"><strong>1</strong> overdue');
  expect(html).toContain("Initial task · not-started");
  expect(html).toContain("Primary");
  expect(html).toContain("Secondary");
  expect(html).not.toContain("<h2>Teams</h2>");
  expect(html).not.toContain("Manage subteams");
  expect(html).toContain('aria-label="Search teams"');
  expect(html).toMatch(/<header class="panel-header team-card-header">[\s\S]*class="metric-grid"[\s\S]*class="team-actions-menu"[\s\S]*<\/header>/);
  expect(html).toMatch(/class="team-task-legend">[\s\S]*team-task-open-filter[\s\S]*Done[\s\S]*team-task-status-filter is-blocked[\s\S]*team-task-status-filter is-overdue/);
  expect(html).toMatch(/class="topbar-responsive-search[^"]*"[\s\S]*aria-label="Filter teams"[\s\S]*aria-label="Sort teams"[\s\S]*?<\/div>/);
  expect(html).toContain('aria-label="Create team"');
  expect(html.match(/class="team-member-load"/g)).toHaveLength(3);
  expect(html).toContain("Capacity");
  expect(html).toContain("6.0h");
  expect(html).toContain("0.0h");
});
