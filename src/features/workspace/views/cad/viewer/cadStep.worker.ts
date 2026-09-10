import initialize from "occt-import-js";
import wasmUrl from "occt-import-js/dist/occt-import-js.wasm?url";
import { validateCadMeshes, type CadGeometryResult } from "./cadGeometry";

self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
  try {
    const occt = await initialize({ locateFile: () => wasmUrl });
    const result = occt.ReadStepFile(new Uint8Array(event.data), { linearUnit: "millimeter" });
    if (!result.success) throw new Error("Unable to read this STEP file. Re-export it as STEP AP203, AP214 or AP242.");
    self.postMessage({ meshes: validateCadMeshes(result.meshes) } satisfies CadGeometryResult);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Unable to prepare the STEP geometry." } satisfies CadGeometryResult);
  }
};
