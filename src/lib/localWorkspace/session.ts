import type { BootstrapPayload } from "@/types/bootstrap";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import { localRosterInsights } from "./roster";
import { applyLocalCommand, refreshLocalTaskState } from "./commands";

const STORAGE_KEY = "meco.local-demo.v1";
export type LocalWorkspaceMode = "demo" | "tutorial" | null;
type Workspace = { mode: Exclude<LocalWorkspaceMode, null>; snapshot: BootstrapPayload | null; ready: Promise<void> | null };
let active: Workspace | null = null;
let beforeTutorial: Workspace | null = null;
let seed: BootstrapPayload | null = null;
let generation = 0;
export function getLocalWorkspaceGeneration() { return generation; }
const listeners = new Set<() => void>();

export function getLocalWorkspaceMode(): LocalWorkspaceMode { return active?.mode ?? null; }
export function subscribeLocalWorkspace(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function changed() { generation += 1; listeners.forEach((listener) => listener()); }

export function enterLocalDemo() {
  if (active) return;
  active = { mode: "demo", snapshot: null, ready: null };
  changed();
}

// Local data is never attached to an authenticated workspace or queued for upload.
export function leaveLocalWorkspace() {
  active = null;
  beforeTutorial = null;
  changed();
}

async function initialize(workspace: Workspace, loadSeed: () => Promise<BootstrapPayload>) {
  if (workspace.snapshot) return;
  if (!workspace.ready) {
    workspace.ready = (async () => {
      if (workspace.mode === "demo") {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { baseline: BootstrapPayload; snapshot: BootstrapPayload };
          if (!Array.isArray(parsed.snapshot?.tasks) || !Array.isArray(parsed.baseline?.members)) {
            throw new Error("Local demo data is invalid. Use Reset demo to restore the examples.");
          }
          seed = normalizeBootstrapPayload(parsed.baseline);
          workspace.snapshot = normalizeBootstrapPayload(parsed.snapshot);
          return;
        }
      }
      const baseline = seed ?? normalizeBootstrapPayload(await loadSeed());
      if (workspace !== active) throw new Error("The workspace changed. This local operation was cancelled.");
      const snapshot = structuredClone(baseline);
      if (workspace.mode === "demo") window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ baseline, snapshot }));
      seed = baseline;
      workspace.snapshot = snapshot;
    })().catch((error: unknown) => {
      workspace.ready = null;
      throw error;
    });
  }
  await workspace.ready;
}

export function resetLocalDemo() {
  // Remove first: storage failure must not report a successful reset.
  window.sessionStorage.removeItem(STORAGE_KEY);
  seed = null;
  active = { mode: "demo", snapshot: null, ready: null };
  beforeTutorial = null;
  changed();
}

const sessionRoutes = new Set([
  "/auth/config", "/auth/web/session", "/auth/web/logout", "/auth/web/google",
  "/auth/web/email/verify", "/auth/web/dev-bypass", "/auth/email/start",
]);
export function shouldHandleLocally(path: string) {
  return path.startsWith("/tutorial/session/") || (active !== null && !sessionRoutes.has(path));
}

export async function requestLocalWorkspace<T>(
  path: string,
  options: RequestInit,
  loadSeed: () => Promise<BootstrapPayload>,
): Promise<T> {
  const pathname = path.split("?", 1)[0];
  if (pathname === "/tutorial/session/start") {
    if (active?.mode !== "tutorial") {
      beforeTutorial = active;
      active = { mode: "tutorial", snapshot: null, ready: null };
      changed();
    }
  }
  const workspace = active;
  if (!workspace) throw new Error("The local workspace is no longer active.");
  try {
    await initialize(workspace, loadSeed);
  } catch (error) {
    if (pathname === "/tutorial/session/start" && active === workspace) {
      active = beforeTutorial;
      beforeTutorial = null;
      changed();
    }
    throw error;
  }
  if (workspace !== active) throw new Error("The workspace changed. This local operation was cancelled.");
  const current = workspace.snapshot!;
  refreshLocalTaskState(current);
  if (pathname === "/tutorial/session/start") return { ok: true } as T;
  if (pathname === "/tutorial/session/reset") {
    if (workspace.mode !== "tutorial") throw new Error("No local tutorial is active.");
    const body = typeof options.body === "string" ? JSON.parse(options.body) as { mode?: string } : {};
    if (body.mode === "baseline") workspace.snapshot = structuredClone(seed!);
    else {
      active = beforeTutorial;
      beforeTutorial = null;
      changed();
    }
    return { ok: true } as T;
  }
  if (pathname === "/bootstrap") return structuredClone(current) as T;
  if (pathname === "/roster/insights") return localRosterInsights(current, new URLSearchParams(path.split("?")[1])) as T;
  const draft = structuredClone(current);
  const result = applyLocalCommand(draft, path, options);
  if ((options.method ?? "GET").toUpperCase() !== "GET") {
    if (workspace.mode === "demo") {
      // Save before publishing. Quota/privacy errors leave the previous state intact.
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ baseline: seed, snapshot: draft }));
    }
    workspace.snapshot = draft;
  }
  return structuredClone(result) as T;
}

export async function localMediaUrl(file: File) {
  if (!active) throw new Error("The local workspace is no longer active.");
  const workspace = active;
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
  if (workspace !== active) throw new Error("The workspace changed while reading the file.");
  return url;
}
