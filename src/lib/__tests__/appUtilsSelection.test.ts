/// <reference types="jest" />

import { buildEmptyArtifactPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";
import { buildEmptyTaskPayload, getProjectTaskTargetLabel, setTaskPrimaryTargetSelection, toggleTaskTargetSelection } from "@/lib/appUtils/taskTargets";
import { findMemberForSessionUser } from "@/lib/appUtils/common";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";

describe("appUtils selection helpers", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("getProjectTaskTargetLabel rebrands subsystem targets by project type", () => {
    const bootstrap = createBootstrap();

    expect(getProjectTaskTargetLabel(bootstrap.projects[0])).toBe("Subsystems");
    expect(getProjectTaskTargetLabel(bootstrap.projects[1])).toBe("Workstreams");
  });

  it("findMemberForSessionUser matches the signed-in user by normalized email", () => {
    const bootstrap = createBootstrap();

    const member = findMemberForSessionUser(bootstrap.members, {
      email: " Student@MECO.TEST ",
    });

    expect(member?.id).toBe("student-1");
  });

  it("findMemberForSessionUser returns null when the signed-in user is not on the roster", () => {
    const bootstrap = createBootstrap();

    const member = findMemberForSessionUser(bootstrap.members, {
      email: "missing@meco.test",
    });

    expect(member).toBeNull();
  });

  it("toggleTaskTargetSelection treats workstream selection as a subsystem alias", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      workstreamId: null,
      workstreamIds: [],
      subsystemId: "",
      subsystemIds: [],
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "workstream",
      id: "subsystem-secondary",
    });

    expect(next.workstreamId).toBeNull();
    expect(next.workstreamIds).toEqual([]);
    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
  });

  it("setTaskPrimaryTargetSelection keeps the task on one subsystem and clears unrelated scope", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      subsystemId: "subsystem-core",
      subsystemIds: ["subsystem-core"],
      mechanismId: "mechanism-1",
      mechanismIds: ["mechanism-1"],
      partInstanceId: "part-instance-1",
      partInstanceIds: ["part-instance-1"],
    };

    const next = setTaskPrimaryTargetSelection(payload, bootstrap, "subsystem-secondary");

    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
    expect(next.mechanismId).toBeNull();
    expect(next.mechanismIds).toEqual([]);
    expect(next.partInstanceId).toBeNull();
    expect(next.partInstanceIds).toEqual([]);
  });

  it("toggleTaskTargetSelection selects implied mechanism and subsystem for a part instance", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      mechanismId: null,
      mechanismIds: [],
      partInstanceId: null,
      partInstanceIds: [],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "part-instance",
      id: "part-instance-1",
    });

    expect(next.subsystemIds).toEqual(["subsystem-core"]);
    expect(next.mechanismId).toBe("mechanism-1");
    expect(next.mechanismIds).toEqual(["mechanism-1"]);
    expect(next.partInstanceId).toBe("part-instance-1");
    expect(next.partInstanceIds).toEqual(["part-instance-1"]);
  });

  it("toggleTaskTargetSelection removes child targets when a subsystem is deselected", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      subsystemId: "subsystem-core",
      subsystemIds: ["subsystem-core", "subsystem-secondary"],
      mechanismId: "mechanism-1",
      mechanismIds: ["mechanism-1"],
      partInstanceId: "part-instance-1",
      partInstanceIds: ["part-instance-1"],
    };

    const next = toggleTaskTargetSelection(payload, bootstrap, {
      kind: "subsystem",
      id: "subsystem-core",
    });

    expect(next.subsystemId).toBe("subsystem-secondary");
    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
    expect(next.mechanismId).toBeNull();
    expect(next.mechanismIds).toEqual([]);
    expect(next.partInstanceId).toBeNull();
    expect(next.partInstanceIds).toEqual([]);
  });

  it("buildEmptyArtifactPayload clears workstream when it does not match project scope", () => {
    const payload = buildEmptyArtifactPayload(createBootstrap(), {
      projectId: "project-a",
      workstreamId: "workstream-b",
    });

    expect(payload.projectId).toBe("project-a");
    expect(payload.workstreamId).toBeNull();
  });

  it("buildEmptyWorkLogPayload uses a valid preferred participant id", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 2, 23, 30));
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "student-1");
    expect(payload.date).toBe("2026-01-02");
    expect(payload.participantIds).toEqual(["student-1"]);
  });

  it("buildEmptyWorkLogPayload falls back to first member for invalid preferred id", () => {
    const payload = buildEmptyWorkLogPayload(createBootstrap(), "missing");
    expect(payload.participantIds).toEqual(["lead-1"]);
  });
});
