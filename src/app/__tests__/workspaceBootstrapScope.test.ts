import { scopeBootstrapBySelection } from "@/app/state/workspaceBootstrapScope";
import { createScopeBootstrap, ids } from "./workspaceBootstrapScopeFixture";

const scope = () => scopeBootstrapBySelection(createScopeBootstrap(), "season-1", "project-visible");

describe("workspace season and project scope", () => {
  it("filters core project, subsystem, mechanism, part and task records", () => {
    const scoped = scope();
    expect(ids(scoped.projects)).toEqual(["project-visible"]);
    expect(ids(scoped.subsystems)).toEqual(["subsystem-visible"]);
    expect(ids(scoped.mechanisms)).toEqual(["mechanism-visible"]);
    expect(ids(scoped.partInstances)).toEqual(["part-visible"]);
    expect(ids(scoped.tasks)).toEqual(["task-visible"]);
  });

  it("retains dependencies only when both task and referenced target are visible", () => {
    expect(ids(scope().taskDependencies)).toEqual(["dep-global-milestone", "dep-visible-part"]);
  });

  it("filters canonical risks by their project ownership", () => {
    expect(ids(scope().risks)).toEqual(["risk-visible"]);
  });

  it("filters work logs by visible task and retains global milestones and meetings", () => {
    const scoped = scope();
    expect(ids(scoped.workLogs)).toEqual(["worklog-0"]);
    expect(ids(scoped.milestones)).toEqual(["milestone-visible", "milestone-global"]);
    expect(ids(scoped.meetings)).toEqual(["meeting-visible", "meeting-global"]);
  });
});
