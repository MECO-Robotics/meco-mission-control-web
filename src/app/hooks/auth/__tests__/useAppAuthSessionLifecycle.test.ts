/// <reference types="jest" />

import { restoreStoredSession } from "../useAppAuthSessionLifecycle";
import { fetchCurrentUser } from "@/lib/auth/core/request";
import {
  clearStoredSessionToken,
  loadStoredSessionToken,
} from "@/lib/auth/core/sessionStorage";
import type { SessionUser } from "@/lib/auth/types";

jest.mock("@/lib/auth/core/request", () => ({
  fetchCurrentUser: jest.fn(),
  isApiErrorLike: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number",
}));

jest.mock("@/lib/auth/core/sessionStorage", () => ({
  clearStoredSessionToken: jest.fn(),
  loadStoredSessionToken: jest.fn(),
}));

const fetchCurrentUserMock = fetchCurrentUser as jest.Mock;
const loadStoredSessionTokenMock = loadStoredSessionToken as jest.Mock;
const clearStoredSessionTokenMock = clearStoredSessionToken as jest.Mock;

describe("restoreStoredSession", () => {
  it("restores the stored session user", async () => {
    const sessionUser: SessionUser = {
      accountId: "user-1",
      authProvider: "email",
      email: "user@example.com",
      hostedDomain: "example.com",
      name: "User One",
      picture: null,
      role: "student",
    };
    const onSessionExpired = jest.fn();
    const setSessionUser = jest.fn();

    loadStoredSessionTokenMock.mockReturnValue("stored-token");
    fetchCurrentUserMock.mockResolvedValue(sessionUser);

    await restoreStoredSession({ onSessionExpired, setSessionUser });

    expect(fetchCurrentUserMock).toHaveBeenCalledWith("stored-token");
    expect(setSessionUser).toHaveBeenCalledWith(sessionUser);
    expect(clearStoredSessionTokenMock).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("requests sign-in when the stored token is rejected", async () => {
    const onSessionExpired = jest.fn();
    const setSessionUser = jest.fn();

    loadStoredSessionTokenMock.mockReturnValue("expired-token");
    fetchCurrentUserMock.mockRejectedValue({ statusCode: 401 });

    await restoreStoredSession({ onSessionExpired, setSessionUser });

    expect(clearStoredSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(setSessionUser).not.toHaveBeenCalled();
  });

  it("does not request sign-in for transient stored-token restore failures", async () => {
    const onSessionExpired = jest.fn();
    const setSessionUser = jest.fn();

    loadStoredSessionTokenMock.mockReturnValue("stored-token");
    const transientError = { statusCode: 500 };
    fetchCurrentUserMock.mockRejectedValue(transientError);

    await expect(
      restoreStoredSession({ onSessionExpired, setSessionUser }),
    ).rejects.toBe(transientError);

    expect(clearStoredSessionTokenMock).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(setSessionUser).not.toHaveBeenCalled();
  });

  it("does not request sign-in after cancellation", async () => {
    const onSessionExpired = jest.fn();
    const setSessionUser = jest.fn();

    loadStoredSessionTokenMock.mockReturnValue("expired-token");
    fetchCurrentUserMock.mockRejectedValue({ statusCode: 401 });

    await restoreStoredSession({
      isCancelled: () => true,
      onSessionExpired,
      setSessionUser,
    });

    expect(clearStoredSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(setSessionUser).not.toHaveBeenCalled();
  });
});
