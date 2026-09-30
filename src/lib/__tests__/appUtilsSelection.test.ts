/// <reference types="jest" />

import { buildEmptyArtifactPayload, buildEmptyWorkLogPayload } from "@/lib/appUtils/payloadBuilders";
import { buildEmptyTaskPayload, setTaskPrimaryTargetSelection } from "@/lib/appUtils/taskTargets";
import {
  findMemberForSessionUser,
  getRosterLinkedMemberId,
  resolveSignedInMemberForSessionUser,
} from "@/lib/appUtils/common";
import { createBootstrap } from "@/lib/appUtilsTestFixtures";

describe("appUtils selection helpers", () => {
  afterEach(() => {
    jest.useRealTimers();
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

  it("resolveSignedInMemberForSessionUser reflects local dev mentor sessions", () => {
    const bootstrap = createBootstrap();

    const member = resolveSignedInMemberForSessionUser(bootstrap.members, {
      accountId: "local-dev",
      email: "dev.mentor@meco.test",
      name: "Local Dev Mentor",
      picture: null,
      role: "mentor",
    });

    expect(member).toMatchObject({
      elevated: true,
      email: "dev.mentor@meco.test",
      id: "local-dev",
      name: "Local Dev Mentor",
      role: "mentor",
      seasonId: "season-2026",
    });
  });

  it("getRosterLinkedMemberId excludes synthetic local dev members from roster filters", () => {
    const bootstrap = createBootstrap();

    expect(getRosterLinkedMemberId(bootstrap.members, bootstrap.members[0])).toBe("lead-1");
    expect(getRosterLinkedMemberId(bootstrap.members, { id: "local-dev" })).toBeNull();
  });

  it("setTaskPrimaryTargetSelection keeps the task on one subsystem and clears unrelated scope", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      workstreamIds: ["workstream-independent"],
      subsystemIds: ["subsystem-core"],
      mechanismIds: ["mechanism-1"],
      partInstanceIds: ["part-instance-1"],
    };

    const next = setTaskPrimaryTargetSelection(payload, bootstrap, "subsystem-secondary");

    expect(next.subsystemIds).toEqual(["subsystem-secondary"]);
    expect(next.workstreamIds).toEqual(["workstream-independent"]);
    expect(next.mechanismIds).toEqual([]);
    expect(next.partInstanceIds).toEqual([]);
  });

  it("clears all target fields when the primary selection is removed", () => {
    const bootstrap = createBootstrap();
    const payload = {
      ...buildEmptyTaskPayload(bootstrap),
      subsystemIds: ["subsystem-core"],
      mechanismIds: ["mechanism-1"],
      partInstanceIds: ["part-instance-1"],
    };
    const next = setTaskPrimaryTargetSelection(payload, bootstrap, "");
    expect(next).toMatchObject({
      subsystemIds: [], mechanismIds: [], partInstanceIds: [], workstreamIds: [],
    });
    expect(payload.partInstanceIds).toEqual(["part-instance-1"]);
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
