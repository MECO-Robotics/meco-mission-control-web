import type { BootstrapPayload } from "@/types/bootstrap";
import { normalizeBootstrapPayload } from "@/lib/auth/bootstrap/payload";
import { localRosterInsights } from "./roster";
import { applyLocalCommand, refreshLocalTaskState } from "./commands";

const STORAGE_KEY = "meco.local-demo.v1";
const SNAPSHOT_SCHEMA_VERSION = 2;
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
          let parsed: unknown;
          try {
            parsed = JSON.parse(saved);
          } catch {
            parsed = null;
          }
          const candidate = parsed && typeof parsed === "object" ? parsed as { schemaVersion?: number; baseline?: BootstrapPayload; snapshot?: BootstrapPayload } : null;
          const compatible = candidate?.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
            Array.isArray(candidate.snapshot?.tasks) && Array.isArray(candidate.baseline?.members);
          let restored: { baseline: BootstrapPayload; snapshot: BootstrapPayload } | null = null;
          if (compatible) {
            try {
              restored = {
                baseline: normalizeBootstrapPayload(candidate!.baseline!),
                snapshot: normalizeBootstrapPayload(candidate!.snapshot!),
              };
            } catch {
              // A matching version can still contain a partial or corrupt bootstrap.
            }
          }
          if (!restored) {
            const version = candidate?.schemaVersion ?? "unknown";
            let archiveKey = `${STORAGE_KEY}.incompatible.${version}`;
            let suffix = 1;
            while (window.sessionStorage.getItem(archiveKey) !== null) archiveKey = `${STORAGE_KEY}.incompatible.${version}.${suffix++}`;
            let archived = false;
            let archiveError: unknown;
            try {
              window.sessionStorage.setItem(archiveKey, saved);
              archived = true;
            } catch (error) {
              archiveError = error;
              // Removing the invalid snapshot takes priority when storage is full.
            }
            window.sessionStorage.removeItem(STORAGE_KEY);
            const recovery = archived ? `archived as ${archiveKey}` : "removed without an archive because browser storage rejected the archive";
            const warning = `Local demo snapshot schema ${version} is incompatible with schema ${SNAPSHOT_SCHEMA_VERSION}; ${recovery} and reset to the current examples.`;
            if (archived) console.warn(warning);
            else console.warn(warning, archiveError);
          } else {
            seed = restored.baseline;
            workspace.snapshot = restored.snapshot;
            return;
          }
        }
      }
      const baseline = seed ?? normalizeBootstrapPayload(await loadSeed());
      if (workspace !== active) throw new Error("The workspace changed. This local operation was cancelled.");
      const snapshot = structuredClone(baseline);
      seed = baseline;
      workspace.snapshot = snapshot;
      if (workspace.mode === "demo") {
        try {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SNAPSHOT_SCHEMA_VERSION, baseline, snapshot }));
        } catch (error) {
          console.warn("The local demo is loaded for this session, but browser storage rejected its baseline. Reads are available; edits cannot be saved or published until browser storage accepts writes.", error);
        }
      }
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
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SNAPSHOT_SCHEMA_VERSION, baseline: seed, snapshot: draft }));
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
