import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { TeamsView } from "../views/TeamsView";
import { createResponsibleGroup, updateResponsibleGroup } from "@/lib/auth/records/responsibleGroups";
import { WorkspaceTopbarAddMenu } from "@/features/workspace/shared/ui";
import { WorkspaceColorField } from "@/features/workspace/modals/WorkspaceColorField";

jest.mock("@/lib/auth/records/responsibleGroups", () => ({ createResponsibleGroup: jest.fn(), updateResponsibleGroup: jest.fn(), deleteResponsibleGroup: jest.fn() }));

function elements(node: React.ReactNode): React.ReactElement<Record<string, unknown>>[] {
  return React.Children.toArray(node).flatMap(child => React.isValidElement<Record<string, unknown>>(child)
    ? [child, ...elements(child.props.children as React.ReactNode)] : []);
}

it.each(["create", "edit"])("saves the selected team identity through the %s editor and restores it on reopen", async (mode) => {
  const bootstrap = createBootstrap();
  const team = { id: "custom", seasonId: "season-2026", name: "Custom team", icon: "wrench" as const, color: "#2A9D8F", projectIds: [], workTypeIds: ["unrelated-discipline"], memberIds: [], primaryMemberIds: [], isArchived: true };
  bootstrap.responsibleGroups = [team];
  const values: unknown[] = [];
  let cursor = 0;
  const state = jest.spyOn(React, "useState").mockImplementation((initial?: unknown) => {
    const index = cursor++;
    if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
    return [values[index], (next: unknown) => { values[index] = typeof next === "function" ? next(values[index]) : next; }];
  });
  const memo = jest.spyOn(React, "useMemo").mockImplementation(factory => factory());
  const props: React.ComponentProps<typeof TeamsView> = { bootstrap, selectedSeasonId: team.seasonId, selectedProjectId: null, onRefresh: jest.fn(), handleUnauthorized: jest.fn(), onOpenTask: jest.fn(), onOpenMember: jest.fn(), onError: jest.fn() };
  const render = () => { cursor = 0; return elements(TeamsView(props)); };
  const edit = () => {
    const button = render().find(element => element.props["aria-label"] === "Edit Custom team") as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    button.props.onClick!({} as React.MouseEvent<HTMLButtonElement>);
  };
  try {
    if (mode === "edit") edit();
    else {
      const add = render().find(element => element.type === WorkspaceTopbarAddMenu) as unknown as React.ReactElement<React.ComponentProps<typeof WorkspaceTopbarAddMenu>>;
      add.props.actions[0].onSelect();
      const name = render().find(element => element.type === "input" && element.props.required) as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
      name.props.onChange!({ target: { value: team.name } } as React.ChangeEvent<HTMLInputElement>);
    }
    const icon = render().find(element => element.type === "select" && element.props.value === (mode === "edit" ? "wrench" : "users")) as React.ReactElement<React.SelectHTMLAttributes<HTMLSelectElement>>;
    icon.props.onChange!({ target: { value: "megaphone" } } as React.ChangeEvent<HTMLSelectElement>);
    const color = render().find(element => element.type === WorkspaceColorField) as React.ReactElement<React.ComponentProps<typeof WorkspaceColorField>>;
    color.props.onChange("#C855BC");
    const form = render().find(element => element.type === "form") as React.ReactElement<{ onSubmit: (event: React.FormEvent) => Promise<void> }>;
    await form.props.onSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent);
    const call = mode === "edit" ? jest.mocked(updateResponsibleGroup).mock.calls.at(-1)! : jest.mocked(createResponsibleGroup).mock.calls.at(-1)!;
    const payload = call[mode === "edit" ? 1 : 0];
    expect(payload).toMatchObject({ name: team.name, icon: "megaphone", color: "#C855BC" });
    expect(payload).not.toHaveProperty("workTypeIds");
    bootstrap.responsibleGroups = [{ ...team, icon: "megaphone", color: "#C855BC" }];
    edit();
    expect(render().find(element => element.type === "select" && element.props.value === "megaphone")).toBeDefined();
    expect((render().find(element => element.type === WorkspaceColorField) as React.ReactElement<React.ComponentProps<typeof WorkspaceColorField>>).props.value).toBe("#C855BC");
    expect(props.onError).not.toHaveBeenCalled();
  } finally { state.mockRestore(); memo.mockRestore(); }
});

it("derives team workload for all-project groups and excludes archived work from active metrics", () => {
  const bootstrap = createBootstrap();
  bootstrap.members[0].plannedWeeklyAttendanceHours = 6;
  bootstrap.responsibleGroups = [
    { id: "group-all", seasonId: "season-2026", name: "All Projects", icon: "users", color: "#4F86C6", projectIds: [], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: ["lead-1"], isArchived: false },
    { id: "group-secondary", seasonId: "season-2026", name: "Programming", icon: "code", color: "#2A9D8F", projectIds: [], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: [], isArchived: false },
    { id: "group-old", seasonId: "season-2026", name: "Archived Team", icon: "briefcase", color: "#C855BC", projectIds: ["project-a"], workTypeIds: [], memberIds: ["lead-1"], primaryMemberIds: [], isArchived: true },
  ];
  bootstrap.tasks = [{ ...bootstrap.tasks[0], responsibleGroupId: "group-all", ownerId: "lead-1", estimatedHours: 6, actualHours: 1, isBlocked: true, dueDate: "2026-01-01" }];
  const html = renderToStaticMarkup(createElement(TeamsView, { bootstrap, selectedSeasonId: "season-2026", selectedProjectId: "project-a", onRefresh: async () => undefined, handleUnauthorized: () => undefined, onOpenTask: () => undefined, onOpenMember: () => undefined, onError: () => undefined }));

  expect(html).toContain("All Projects");
  expect(html).toContain("Archived Team");
  expect(html).toContain("estimated hours remaining");
  expect(html).toContain("5.0h");
  expect(html).toContain('aria-label="Blocked 1"');
  expect(html).toContain('aria-label="Overdue 1"');
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
  expect(html).toMatch(/class="topbar-responsive-search[^"]*"[\s\S]*aria-label="Filter teams"[\s\S]*aria-label="Sort teams, 1 active"[\s\S]*?<\/div>/);
  expect(html).toContain('aria-label="Create team"');
  expect(html.match(/class="team-member-load"/g)).toHaveLength(3);
  expect(html).toContain("Capacity");
  expect(html).toContain("6.0h");
  expect(html).toContain("0.0h");
});
