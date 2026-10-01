import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { TeamsView } from "../views/TeamsView";

it("derives team workload for all-project groups and excludes archived work from active metrics", () => {
  const bootstrap = createBootstrap();
  bootstrap.responsibleGroups = [
    { id: "group-all", seasonId: "season-2026", name: "All Projects", projectIds: [], memberIds: ["lead-1"], isArchived: false },
    { id: "group-old", seasonId: "season-2026", name: "Archived Team", projectIds: ["project-a"], memberIds: ["lead-1"], isArchived: true },
  ];
  bootstrap.tasks = [{ ...bootstrap.tasks[0], responsibleGroupId: "group-all", ownerId: "lead-1", estimatedHours: 6, actualHours: 1, isBlocked: true, dueDate: "2026-01-01" }];
  const html = renderToStaticMarkup(createElement(TeamsView, { bootstrap, selectedSeasonId: "season-2026", selectedProjectId: "project-a", onRefresh: async () => undefined, handleUnauthorized: () => undefined, onOpenTask: () => undefined, onOpenMember: () => undefined, onError: () => undefined }));

  expect(html).toContain("All Projects");
  expect(html).toContain("Archived Team");
  expect(html).toContain("Estimated hours remaining");
  expect(html).toContain("5.0h");
  expect(html).toContain("Blocked tasks");
  expect(html).toContain("Overdue tasks");
  expect(html).toContain("Initial task · not-started");
});
