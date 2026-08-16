/// <reference types="jest" />

import { restoreStoredSession } from "../useAppAuthSessionLifecycle";
import { restoreWebSession } from "@/lib/auth/session";
import { clearWebSessionState } from "@/lib/auth/core/sessionStorage";
import type { SessionUser } from "@/lib/auth/types";

jest.mock("@/lib/auth/session", () => ({
  restoreWebSession: jest.fn(),
  validateSession: jest.fn(),
}));

jest.mock("@/lib/auth/core/sessionStorage", () => ({
  clearWebSessionState: jest.fn(),
}));

jest.mock("@/app/hooks/auth/useAppAuthSessionConfig", () => ({
  fetchAuthConfig: jest.fn(),
}));

const restoreWebSessionMock = restoreWebSession as jest.Mock;
const clearWebSessionStateMock = clearWebSessionState as jest.Mock;

describe("restoreStoredSession", () => {
  const sessionUser: SessionUser = {
    accountId: "user-1",
    authProvider: "email",
    email: "user@example.com",
    hostedDomain: "example.com",
    name: "User One",
    picture: null,
    role: "student",
  };

  beforeEach(() => {
    restoreWebSessionMock.mockResolvedValue({
      csrfToken: "csrf-token",
      expiresAt: "2026-08-11T00:00:00.000Z",
      user: sessionUser,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("restores the user from the server-managed cookie session", async () => {
    const setSessionUser = jest.fn();

    await restoreStoredSession({ setSessionUser });

    expect(restoreWebSessionMock).toHaveBeenCalledTimes(1);
    expect(setSessionUser).toHaveBeenCalledWith(sessionUser);
    expect(clearWebSessionStateMock).not.toHaveBeenCalled();
  });

  it("treats a missing or expired cookie as a signed-out browser", async () => {
    const setSessionUser = jest.fn();
    restoreWebSessionMock.mockRejectedValue({ statusCode: 401 });

    await restoreStoredSession({ setSessionUser });

    expect(clearWebSessionStateMock).toHaveBeenCalledTimes(1);
    expect(setSessionUser).not.toHaveBeenCalled();
  });

  it("surfaces transient restore failures", async () => {
    const setSessionUser = jest.fn();
    const transientError = { statusCode: 500 };
    restoreWebSessionMock.mockRejectedValue(transientError);

    await expect(restoreStoredSession({ setSessionUser })).rejects.toBe(
      transientError,
    );

    expect(clearWebSessionStateMock).not.toHaveBeenCalled();
    expect(setSessionUser).not.toHaveBeenCalled();
  });

  it("does not update UI state after cancellation", async () => {
    const setSessionUser = jest.fn();

    await restoreStoredSession({
      isCancelled: () => true,
      setSessionUser,
    });

    expect(setSessionUser).not.toHaveBeenCalled();
  });
});
