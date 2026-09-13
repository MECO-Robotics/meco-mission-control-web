import workerUrl from "./cadStep.worker?worker&url";
import type { CadGeometryResult, CadMesh } from "./cadGeometry";

// Trust only the worker URL emitted by our build, never a URL from an uploaded file.
const trustedTypes = (globalThis as typeof globalThis & {
  trustedTypes?: { createPolicy(name: string, rules: { createScriptURL(value: string): string }): { createScriptURL(value: string): string } };
}).trustedTypes;
const workerPolicy = trustedTypes?.createPolicy("meco-cad-worker", {
  createScriptURL(value) {
    if (value !== workerUrl) throw new Error("Unexpected CAD worker URL.");
    return value;
  },
});

export function loadCadGeometry(file: File, signal: AbortSignal): Promise<CadMesh[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Canceled", "AbortError")); return; }
    if (file.size > 50 * 1024 * 1024) { reject(new Error("Choose a STEP file smaller than 50 MB for the 3D preview.")); return; }
    const worker = new Worker(workerPolicy?.createScriptURL(workerUrl) ?? workerUrl, { type: "module" });
    const cleanup = () => { clearTimeout(timeout); worker.terminate(); signal.removeEventListener("abort", abort); };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const abort = () => fail(new DOMException("Canceled", "AbortError"));
    const timeout = setTimeout(() => fail(new Error("Preparing the geometry took too long. Try exporting a smaller assembly.")), 120_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => fail(new Error("The geometry reader could not start. Reload the page and try again."));
    worker.onmessage = (event: MessageEvent<CadGeometryResult>) => {
      cleanup();
      if (event.data.error !== undefined) reject(new Error(event.data.error));
      else resolve(event.data.meshes);
    };
    void file.arrayBuffer().then((buffer) => {
      if (!signal.aborted) worker.postMessage(buffer, [buffer]);
    }).catch((error: Error) => fail(error));
  });
}
