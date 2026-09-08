/// <reference types="jest" />

import {
  requestDevBypassSignIn,
  restoreWebSession,
  revokeWebSession,
} from "../session";
import { fetchWebSession, postJson, requestApi } from "../core/request";
import {
  purgeLegacySessionTokens,
  hasPendingSignOut,
  setPendingSignOut,
  setSessionCsrfToken,
} from "../core/sessionStorage";

jest.mock("../core/request", () => ({
  fetchWebSession: jest.fn(),
  isApiErrorLike: jest.fn(),
  postJson: jest.fn(),
  requestApi: jest.fn(),
}));

jest.mock("../core/sessionStorage", () => ({
  clearWebSessionState: jest.fn(),
  hasPendingSignOut: jest.fn(() => false),
  setPendingSignOut: jest.fn(),
  getSessionCsrfToken: jest.fn(),
  purgeLegacySessionTokens: jest.fn(),
  setSessionCsrfToken: jest.fn(),
}));

const fetchWebSessionMock = fetchWebSession as jest.Mock;
const postJsonMock = postJson as jest.Mock;
const requestApiMock = requestApi as jest.Mock;
const purgeLegacySessionTokensMock = purgeLegacySessionTokens as jest.Mock;
const setSessionCsrfTokenMock = setSessionCsrfToken as jest.Mock;

describe("web sessions", () => {
  afterEach(() => jest.mocked(hasPendingSignOut).mockReturnValue(false));
  it("does not fetch a residual cookie session while sign-out is pending", async () => {
    jest.mocked(hasPendingSignOut).mockReturnValue(true);
    await expect(restoreWebSession()).rejects.toMatchObject({ statusCode: 401 });
    expect(fetchWebSession).not.toHaveBeenCalled();
  });
  it("discards a restore response if sign-out began while it was in flight", async () => {
    jest.mocked(hasPendingSignOut).mockReturnValueOnce(false).mockReturnValueOnce(true);
    fetchWebSessionMock.mockResolvedValue({ csrfToken: "residual", user: {} });
    await expect(restoreWebSession()).rejects.toMatchObject({ statusCode: 401 });
    expect(setSessionCsrfToken).not.toHaveBeenCalled();
  });
  it("submits the selected role to the web-only development endpoint", async () => {
    const response = {
      csrfToken: "csrf-token",
      expiresAt: "2026-08-11T00:00:00.000Z",
      user: {},
    };
    postJsonMock.mockResolvedValue(response);

    await expect(requestDevBypassSignIn("mentor")).resolves.toBe(response);

    expect(postJsonMock).toHaveBeenCalledWith("/auth/web/dev-bypass", {
      role: "mentor",
    });
    expect(setSessionCsrfTokenMock).toHaveBeenCalledWith("csrf-token");
    expect(setPendingSignOut).toHaveBeenCalledWith(false);
  });

  it("restores a cookie session and keeps its CSRF token in memory", async () => {
    const response = {
      csrfToken: "restored-csrf-token",
      expiresAt: "2026-08-11T00:00:00.000Z",
      user: { accountId: "user-1" },
    };
    fetchWebSessionMock.mockResolvedValue(response);

    await expect(restoreWebSession()).resolves.toBe(response);

    expect(purgeLegacySessionTokensMock).toHaveBeenCalledTimes(1);
    expect(setSessionCsrfTokenMock).toHaveBeenCalledWith(
      "restored-csrf-token",
    );
  });

  it("revokes the server session through an unsafe authenticated request", async () => {
    requestApiMock.mockResolvedValue({ ok: true });

    await revokeWebSession();

    expect(requestApiMock).toHaveBeenCalledWith("/auth/web/logout", {
      keepalive: true,
      method: "POST",
    });
  });
});
