import { restoreWebSession } from "../../session";
import { requestApi, fetchWebSession } from "../request";
import { clearWebSessionState, getSessionCsrfToken, setSessionCsrfToken } from "../sessionStorage";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; clearWebSessionState(); });

it("ignores an old request's 401 after a new session starts", async () => {
  let finish!: (response: Response) => void;
  globalThis.fetch = jest.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  setSessionCsrfToken("old");
  const expire = jest.fn();
  const request = requestApi("/tasks", {}, expire);
  clearWebSessionState();
  setSessionCsrfToken("new");
  finish(new Response('{"message":"expired"}', { status: 401 }));
  await expect(request).rejects.toMatchObject({ statusCode: 401 });
  expect(getSessionCsrfToken()).toBe("new");
  expect(expire).not.toHaveBeenCalled();
});

it("lets the current owner handle a current unauthorized request", async () => {
  globalThis.fetch = jest.fn(async () => new Response('{}', { status: 401 }));
  const expire = jest.fn(clearWebSessionState);
  setSessionCsrfToken("current");
  await expect(requestApi("/tasks", {}, expire)).rejects.toMatchObject({ statusCode: 401 });
  expect(expire).toHaveBeenCalledTimes(1);
  expect(getSessionCsrfToken()).toBeNull();
});

it("keeps local reviewer identity out of the remote HTTP request", async () => {
  globalThis.fetch = jest.fn(async () => new Response('{"item":{}}'));
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: "{\"status\":\"reviewed\"}" };
  await requestApi("/qa-reports/submit", options, undefined, "mentor-b");
  const sentOptions = jest.mocked(fetch).mock.calls[0][1]!;
  expect(sentOptions).toMatchObject({ method: options.method, body: options.body });
  expect(new Headers(sentOptions.headers).get("Content-Type")).toBe("application/json");
  expect(sentOptions).not.toHaveProperty("localActorMemberId");
});

it("keeps the local task QA requester out of the remote HTTP request body", async () => {
  globalThis.fetch = jest.fn(async () => new Response('{"item":{}}'));
  const options = { method: "POST", headers: { "Content-Type": "application/json" }, body: "{\"subject\":\"Build QA\"}" };
  await requestApi("/qa-requests", options, undefined, "student-1");
  const sentOptions = jest.mocked(fetch).mock.calls[0][1]!;
  expect(sentOptions).toMatchObject({ method: options.method, body: options.body });
  expect(sentOptions).not.toHaveProperty("localActorMemberId");
  expect(sentOptions.body).not.toContain("student-1");
});

it("rejects a successful session response without a user", async () => {
  globalThis.fetch = jest.fn(async () => new Response('{"user":null}'));
  await expect(fetchWebSession()).rejects.toMatchObject({ statusCode: 401 });
});

it("does not install an old restore CSRF token after another login", async () => {
  let finish!: (response: Response) => void;
  globalThis.fetch = jest.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  const restoring = restoreWebSession();
  clearWebSessionState();
  setSessionCsrfToken("new-login");
  finish(new Response('{"csrfToken":"old-login","user":{"accountId":"old"}}'));
  await expect(restoring).rejects.toMatchObject({ name: "AbortError" });
  expect(getSessionCsrfToken()).toBe("new-login");
});
