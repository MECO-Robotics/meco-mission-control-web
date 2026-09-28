import { clearWebSessionState, getSessionCsrfToken, setSessionCsrfToken, hasPendingSignOut, setPendingSignOut } from "@/lib/auth/core/sessionStorage";
/// <reference types="jest" />
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  revokeThenClearWebSession,
  UNCONFIRMED_SIGN_OUT_MESSAGE,
  useAppAuthSessionActions,
} from "../useAppAuthSessionActions";
import {
  exchangeGoogleCredential,
  requestDevBypassSignIn,
  revokeWebSession,
  verifyEmailSignInCode,
} from "@/lib/auth/session";
import { beginSessionChange } from "@/lib/auth/core/sessionStorage";
import type { SessionUser } from "@/lib/auth/types";

jest.mock("@/lib/auth/session", () => ({
  exchangeGoogleCredential: jest.fn(),
  requestDevBypassSignIn: jest.fn(),
  requestEmailSignInCode: jest.fn(),
  revokeWebSession: jest.fn(),
  verifyEmailSignInCode: jest.fn(),
}));

jest.mock("@/lib/auth/core/google", () => ({
  signOutFromGoogle: jest.fn(),
}));

const revokeWebSessionMock = revokeWebSession as jest.Mock;
const exchangeGoogleCredentialMock = exchangeGoogleCredential as jest.Mock;
const requestDevBypassSignInMock = requestDevBypassSignIn as jest.Mock;
const verifyEmailSignInCodeMock = verifyEmailSignInCode as jest.Mock;

function createSignInActions() {
  const setAuthMessage = jest.fn();
  const setIsSigningIn = jest.fn();
  const setIsSignInForced = jest.fn();
  const setSessionUser = jest.fn();
  let actions!: ReturnType<typeof useAppAuthSessionActions>;

  function Harness() {
    actions = useAppAuthSessionActions({
      resetWorkspaceRef: { current: jest.fn() },
      setAuthMessage,
      setIsSigningIn,
      setIsSignInForced,
      setSessionUser,
    });
    return null;
  }

  renderToStaticMarkup(React.createElement(Harness));
  return { actions, setAuthMessage, setIsSigningIn, setIsSignInForced, setSessionUser };
}

const sessionUser: SessionUser = {
  accountId: "member-1",
  authProvider: "google",
  email: "member@example.test",
  hostedDomain: "example.test",
  name: "Member",
  picture: null,
};

describe("web sign out", () => {
  afterEach(() => {
    jest.clearAllMocks();
    clearWebSessionState();
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

describe("web sign in", () => {
  it("shares successful session handling across Google and dev bypass", async () => {
    const { actions, setAuthMessage, setIsSigningIn, setIsSignInForced, setSessionUser } =
      createSignInActions();
    const session = { user: sessionUser };
    exchangeGoogleCredentialMock.mockResolvedValue(session);
    requestDevBypassSignInMock.mockResolvedValue(session);

    await actions.handleGoogleCredential({ credential: "google-token" });
    await actions.handleDevBypassSignIn("mentor");

    expect(exchangeGoogleCredentialMock).toHaveBeenCalledWith("google-token");
    expect(requestDevBypassSignInMock).toHaveBeenCalledWith("mentor");
    expect(setAuthMessage).toHaveBeenCalledWith(null);
    expect(setIsSignInForced).toHaveBeenCalledWith(false);
    expect(setSessionUser).toHaveBeenCalledWith(sessionUser);
    expect(setIsSigningIn.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it("keeps email verification errors rethrowing while other sign-in errors resolve", async () => {
    const { actions, setAuthMessage } = createSignInActions();
    const error = new Error("invalid verification code");
    verifyEmailSignInCodeMock.mockRejectedValue(error);
    exchangeGoogleCredentialMock.mockRejectedValue(error);

    await expect(actions.handleVerifyEmailCode("member@example.test", "123456")).rejects.toBe(error);
    await expect(actions.handleGoogleCredential({ credential: "google-token" })).resolves.toBeUndefined();

    expect(setAuthMessage).toHaveBeenCalledWith("invalid verification code");
    expect(setAuthMessage).toHaveBeenCalledWith(null);
  });

  it("does not clear a newer sign-in busy state after an aborted stale request", async () => {
    const { actions, setIsSigningIn, setSessionUser } = createSignInActions();
    let rejectRequest!: (error: Error) => void;
    const pendingSession = new Promise<{ user: SessionUser }>((_resolve, reject) => {
      rejectRequest = reject;
    });
    exchangeGoogleCredentialMock.mockImplementation(() => {
      beginSessionChange();
      return pendingSession;
    });

    const login = actions.handleGoogleCredential({ credential: "google-token" });
    beginSessionChange();
    rejectRequest(Object.assign(new Error("stale request"), { name: "AbortError" }));
    await expect(login).resolves.toBeUndefined();

    expect(setIsSigningIn.mock.calls).toEqual([[true]]);
    expect(setSessionUser).not.toHaveBeenCalled();
  });
});

it("retains CSRF for logout and does not clear a newer login after delayed logout", async () => {
  let finish!: () => void;
  setSessionCsrfToken("logout-csrf");
  revokeWebSessionMock.mockImplementation(() => {
    expect(getSessionCsrfToken()).toBe("logout-csrf");
    return new Promise<void>((resolve) => { finish = resolve; });
  });
  const clearLocal = jest.fn();
  const warn = jest.fn();
  const signingOut = revokeThenClearWebSession(clearLocal, warn);
  clearWebSessionState();
  setSessionCsrfToken("new-login");
  setPendingSignOut(false);
  finish();
  await expect(signingOut).resolves.toBe(false);
  expect(clearLocal).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
  expect(getSessionCsrfToken()).toBe("new-login");
  clearWebSessionState();
});
