import { requestDevBypassSignIn, revokeWebSession } from "../session";
import { getSessionCsrfToken } from "../core/sessionStorage";
import { postJson, requestApi } from "../core/request";
jest.mock("../core/request", () => ({ postJson: jest.fn(), requestApi: jest.fn(), isApiErrorLike: jest.fn(), fetchWebSession: jest.fn() }));

it("orders browser cookie mutations and carries the matching CSRF token into logout", async () => {
  let cookie = "old";
  let finish!: () => void;
  jest.mocked(postJson).mockImplementationOnce(() => new Promise((resolve) => { finish = () => { cookie = "signed-in"; resolve({ csrfToken: "matching", user: {} }); }; }));
  jest.mocked(requestApi).mockImplementationOnce(async () => {
    expect(cookie).toBe("signed-in");
    expect(getSessionCsrfToken()).toBe("matching");
    cookie = "";
    return { ok: true } as never;
  });
  const signIn = requestDevBypassSignIn();
  const logout = revokeWebSession();
  await Promise.resolve();
  expect(requestApi).not.toHaveBeenCalled();
  finish();
  await Promise.all([signIn, logout]);
  expect(cookie).toBe("");
});

it("continues after a rejected mutation and leaves the newest sign-in cookie installed", async () => {
  jest.mocked(requestApi).mockRejectedValueOnce(new Error("offline"));
  const logout = revokeWebSession();
  const rejected = expect(logout).rejects.toThrow("offline");
  jest.mocked(postJson).mockResolvedValueOnce({ csrfToken: "newest", user: {} });
  const signIn = requestDevBypassSignIn();
  await rejected;
  await signIn;
  expect(getSessionCsrfToken()).toBe("newest");
});

it("finishes an older sign-in before issuing the newer cookie mutation", async () => {
  let cookie = "";
  let finish!: () => void;
  jest.mocked(postJson).mockImplementationOnce(() => new Promise((resolve) => {
    finish = () => { cookie = "older"; resolve({ csrfToken: "older", user: {} }); };
  })).mockImplementationOnce(async () => {
    expect(cookie).toBe("older");
    cookie = "newer";
    return { csrfToken: "newer", user: {} } as never;
  });
  const older = requestDevBypassSignIn();
  const stale = expect(older).rejects.toMatchObject({ name: "AbortError" });
  const newer = requestDevBypassSignIn();
  await Promise.resolve(); await Promise.resolve();
  expect(postJson).toHaveBeenCalledTimes(1);
  finish();
  await stale;
  await newer;
  expect(cookie).toBe("newer");
  expect(getSessionCsrfToken()).toBe("newer");
});
