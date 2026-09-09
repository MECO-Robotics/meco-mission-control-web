import { createBootstrap } from "@/lib/appUtilsTestFixtures";
import { EMPTY_BOOTSTRAP } from "@/features/workspace/shared/model/bootstrapDefaults";
import { requestApi } from "@/lib/auth/core/request";
import { enterLocalDemo, getLocalWorkspaceMode, leaveLocalWorkspace, resetLocalDemo } from "../session";
import type { BootstrapPayload } from "@/types/bootstrap";

const originalFetch = globalThis.fetch;
const data = new Map<string, string>();
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: jest.fn((key: string, value: string) => { data.set(key, value); }),
  removeItem: (key: string) => { data.delete(key); },
};
const seed: BootstrapPayload = { ...structuredClone(EMPTY_BOOTSTRAP), materials: [{ id: "material", name: "Original", category: "other", onHandQuantity: 2, reorderPoint: 0, location: "", vendor: "", unit: "each", notes: "" }] };
const write = (name: string) => requestApi("/materials/material", { method: "PATCH", body: JSON.stringify({ name }) });
const read = () => requestApi<BootstrapPayload>("/bootstrap");
beforeEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { sessionStorage: storage } });
  data.clear(); storage.setItem.mockReset().mockImplementation((key, value) => { data.set(key, value); });
  leaveLocalWorkspace(); resetLocalDemo();
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(seed)));
});
afterEach(() => { leaveLocalWorkspace(); globalThis.fetch = originalFetch; });

it("saves demo edits locally across reopening and never sends mutation or refresh requests", async () => {
  await read();
  const calls = jest.mocked(fetch).mock.calls.length;
  await write("Local edit");
  expect((await read()).materials[0].name).toBe("Local edit");
  leaveLocalWorkspace(); enterLocalDemo();
  expect((await read()).materials[0].name).toBe("Local edit");
  expect(fetch).toHaveBeenCalledTimes(calls);
  expect(jest.mocked(fetch).mock.calls.every(([, options]) => !options?.method || options.method === "GET")).toBe(true);
});

it("isolates tutorial changes, resets its baseline, and restores demo edits on exit", async () => {
  await read(); await write("Demo edit");
  await requestApi("/tutorial/session/start", { method: "POST" });
  expect(getLocalWorkspaceMode()).toBe("tutorial");
  expect((await read()).materials[0].name).toBe("Original");
  await write("Tutorial edit");
  await requestApi("/tutorial/session/reset", { method: "POST", body: JSON.stringify({ mode: "baseline" }) });
  expect((await read()).materials[0].name).toBe("Original");
  await requestApi("/tutorial/session/reset", { method: "POST", body: JSON.stringify({ mode: "session" }) });
  expect((await read()).materials[0].name).toBe("Demo edit");
});

it("does not publish a write if browser storage rejects it", async () => {
  await read();
  storage.setItem.mockImplementationOnce(() => { throw new Error("quota exceeded"); });
  await expect(write("Not saved")).rejects.toThrow("quota exceeded");
  expect((await read()).materials[0].name).toBe("Original");
});

it("rejects unsupported local operations without falling through to a write API", async () => {
  await read();
  const calls = jest.mocked(fetch).mock.calls.length;
  await expect(requestApi("/onshape/sync", { method: "POST" })).rejects.toThrow();
  await expect(requestApi("/auth/preferences", { method: "PATCH" })).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(calls);
});

it("returns to the ordinary transport after leaving the local workspace without uploading its state", async () => {
  await read(); await write("Only local");
  leaveLocalWorkspace();
  await read();
  expect(jest.mocked(fetch).mock.calls.at(-1)?.[0]).toBe("/api/bootstrap");
  expect(jest.mocked(fetch).mock.calls.at(-1)?.[1]?.method).toBeUndefined();
});

it.each([200, 401])("ignores a remote %i completion after entering a local workspace", async (status) => {
  leaveLocalWorkspace();
  let finish!: (response: Response) => void;
  globalThis.fetch = jest.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  const expire = jest.fn();
  const pending = requestApi("/bootstrap", {}, expire);
  enterLocalDemo();
  finish(new Response(JSON.stringify(seed), { status }));
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(expire).not.toHaveBeenCalled();
});

it("rolls back failed tutorial entry and cancels a seed load after the owner changes", async () => {
  await jest.isolateModulesAsync(async () => {
    const local = await import("../session");
    await expect(local.requestLocalWorkspace("/tutorial/session/start", { method: "POST" }, async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(local.getLocalWorkspaceMode()).toBeNull();
    let finish!: (value: BootstrapPayload) => void;
    local.enterLocalDemo();
    const pending = local.requestLocalWorkspace("/materials/material", { method: "PATCH", body: JSON.stringify({ name: "Stale" }) }, () => new Promise((resolve) => { finish = resolve; }));
    local.leaveLocalWorkspace();
    finish(seed);
    await expect(pending).rejects.toThrow("cancelled");
    expect(data.size).toBe(0);
  });
});

it("Reset demo reloads the current roster baseline instead of retaining the cached examples", async () => {
  await read();
  const updated = structuredClone(seed);
  updated.materials[0].name = "Updated seed";
  globalThis.fetch = jest.fn(async () => new Response(JSON.stringify(updated)));
  resetLocalDemo();
  expect((await read()).materials[0].name).toBe("Updated seed");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(jest.mocked(fetch).mock.calls[0][1]).toMatchObject({ credentials: "omit" });
});

it("derives cached task hours from logs across reload and tutorial entry", async () => {
  const snapshot = createBootstrap();
  snapshot.tasks[0].actualHours = 999;
  const taskId = snapshot.tasks[0].id;
  const expected = snapshot.workLogs.filter((log) => log.taskId === taskId).reduce((sum, log) => sum + log.hours, 0);
  data.set("meco.local-demo.v1", JSON.stringify({ baseline: snapshot, snapshot }));
  expect((await read()).tasks[0].actualHours).toBe(expected);
  leaveLocalWorkspace(); enterLocalDemo();
  expect((await read()).tasks[0].actualHours).toBe(expected);
  await requestApi("/tutorial/session/start", { method: "POST" });
  expect((await read()).tasks[0].actualHours).toBe(expected);
  expect(fetch).not.toHaveBeenCalled();
});
