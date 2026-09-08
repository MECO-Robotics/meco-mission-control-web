import { hasPendingSignOut, setPendingSignOut } from "@/lib/auth/core/sessionStorage";
/// <reference types="jest" />

import {
  revokeThenClearWebSession,
  UNCONFIRMED_SIGN_OUT_MESSAGE,
} from "../useAppAuthSessionActions";
import { revokeWebSession } from "@/lib/auth/session";

jest.mock("@/lib/auth/session", () => ({
  revokeWebSession: jest.fn(),
}));

jest.mock("@/app/hooks/auth/useAppAuthGoogleIdentity", () => ({
  signOutFromGoogle: jest.fn(),
}));

const revokeWebSessionMock = revokeWebSession as jest.Mock;

describe("web sign out", () => {
  afterEach(() => {
    jest.clearAllMocks();
    setPendingSignOut(false);
  });

  it("clears local state after the first server attempt succeeds", async () => {
    const events: string[] = [];
    const onUnconfirmed = jest.fn();
    revokeWebSessionMock.mockImplementation(async () => {
      events.push("server-revoked");
    });

    await expect(
      revokeThenClearWebSession(
        () => events.push("local-cleared"),
        onUnconfirmed,
      ),
    ).resolves.toBe(true);

    expect(events).toEqual(["server-revoked", "local-cleared"]);
    expect(revokeWebSessionMock).toHaveBeenCalledTimes(1);
    expect(onUnconfirmed).not.toHaveBeenCalled();
    expect(hasPendingSignOut()).toBe(false);
  });

  it("retries once before clearing local state", async () => {
    const events: string[] = [];
    const onUnconfirmed = jest.fn();
    revokeWebSessionMock
      .mockRejectedValueOnce(new Error("temporary network failure"))
      .mockImplementationOnce(async () => {
        events.push("server-revoked");
      });

    await expect(
      revokeThenClearWebSession(
        () => events.push("local-cleared"),
        onUnconfirmed,
      ),
    ).resolves.toBe(true);

    expect(revokeWebSessionMock).toHaveBeenCalledTimes(2);
    expect(events).toEqual(["server-revoked", "local-cleared"]);
    expect(onUnconfirmed).not.toHaveBeenCalled();
    expect(hasPendingSignOut()).toBe(false);
  });

  it("clears local state and warns after both attempts fail", async () => {
    const clearLocalSession = jest.fn();
    const onUnconfirmed = jest.fn();
    revokeWebSessionMock.mockRejectedValue(new Error("network unavailable"));

    await expect(
      revokeThenClearWebSession(clearLocalSession, onUnconfirmed),
    ).resolves.toBe(false);

    expect(revokeWebSessionMock).toHaveBeenCalledTimes(2);
    expect(clearLocalSession).toHaveBeenCalledTimes(1);
    expect(onUnconfirmed).toHaveBeenCalledWith(UNCONFIRMED_SIGN_OUT_MESSAGE);
    expect(hasPendingSignOut()).toBe(true);
  });
});
