import workerUrl from "./cadStep.worker?worker&url";
import type { CadGeometryResult, CadMesh } from "./cadGeometry";

type CadWorkerResult = CadGeometryResult | { glb: ArrayBuffer; error?: never; meshes?: never };
type WorkerOutput = "meshes" | "glb";

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

function runCadWorker(file: File, signal: AbortSignal, output: WorkerOutput): Promise<CadWorkerResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Canceled", "AbortError")); return; }
    if (file.size > 50 * 1024 * 1024) { reject(new Error("Choose a STEP file smaller than 50 MB for the 3D preview.")); return; }
    const worker = new Worker(workerPolicy?.createScriptURL(workerUrl) ?? workerUrl, { type: "module" });
    const cleanup = () => { clearTimeout(timeout); worker.terminate(); signal.removeEventListener("abort", abort); };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const abort = () => fail(new DOMException("Canceled", "AbortError"));
    const timeoutMs = file.size >= 40 * 1024 * 1024 ? 300_000 : 120_000;
    const timeout = setTimeout(() => fail(new Error("Preparing the geometry took too long. Try exporting a smaller assembly.")), timeoutMs);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = () => fail(new Error("The geometry reader could not start. Reload the page and try again."));
    worker.onmessage = (event: MessageEvent<CadWorkerResult>) => {
      cleanup();
      if (event.data.error !== undefined) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    void file.arrayBuffer().then((buffer) => {
      if (!signal.aborted) worker.postMessage({ buffer, output }, [buffer]);
    }).catch((error: Error) => fail(error));
  });
}

export async function loadCadGeometry(file: File, signal: AbortSignal): Promise<CadMesh[]> {
  const result = await runCadWorker(file, signal, "meshes");
  if (!result.meshes) throw new Error("The CAD geometry reader returned no preview meshes.");
  return result.meshes;
}

export async function loadCadGlb(file: File, signal: AbortSignal): Promise<ArrayBuffer> {
  const result = await runCadWorker(file, signal, "glb");
  if (!("glb" in result) || !result.glb) throw new Error("The CAD converter returned no optimized preview.");
  return result.glb;
}
