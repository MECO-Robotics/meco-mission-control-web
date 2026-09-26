jest.mock("../request", () => ({ requestApi: jest.fn() }));

class Script extends EventTarget {
  src = "";
  async = false;
  defer = false;
  remove = jest.fn();
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");

function setup(existing?: Script) {
  jest.resetModules();
  let current = existing;
  const scripts: Script[] = [];
  const createPolicy = jest.fn(() => ({ createScriptURL: (url: string) => url }));
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { hostname: "localhost", protocol: "http:" }, trustedTypes: { createPolicy },
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    querySelector: () => current,
    createElement: () => {
      const script = new Script();
      script.remove.mockImplementation(() => { current = undefined; });
      scripts.push(script);
      return script;
    },
    head: { appendChild: (script: Script) => { current = script; } },
  } });
  if (existing) existing.remove.mockImplementation(() => { current = undefined; });
  const api = jest.requireActual<typeof import("../google")>("../google");
  return { ...api, scripts, createPolicy };
}

afterEach(() => {
  for (const [key, descriptor] of [["window", originalWindow], ["document", originalDocument]] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

it("shares one pending script and Trusted Types policy between callers", async () => {
  const api = setup();
  const first = api.loadGoogleIdentityScript();
  expect(api.loadGoogleIdentityScript()).toBe(first);
  expect(api.scripts).toHaveLength(1);
  expect(api.scripts[0]).toMatchObject({ src: "https://accounts.google.com/gsi/client", async: true, defer: true });
  expect(api.createPolicy).toHaveBeenCalledTimes(1);
  api.scripts[0].dispatchEvent(new Event("load"));
  await expect(first).resolves.toBeUndefined();
});

it.each([false, true])("retries after a failed script (existing=%s)", async (useExisting) => {
  const existing = useExisting ? new Script() : undefined;
  const api = setup(existing);
  const first = api.loadGoogleIdentityScript();
  const failed = existing ?? api.scripts[0];
  failed.dispatchEvent(new Event("error"));
  await expect(first).rejects.toThrow("Google Identity Services failed to load.");
  expect(failed.remove).toHaveBeenCalledTimes(1);
  const retry = api.loadGoogleIdentityScript();
  expect(retry).not.toBe(first);
  api.scripts.at(-1)!.dispatchEvent(new Event("load"));
  await expect(retry).resolves.toBeUndefined();
  expect(api.createPolicy).toHaveBeenCalledTimes(1);
});
