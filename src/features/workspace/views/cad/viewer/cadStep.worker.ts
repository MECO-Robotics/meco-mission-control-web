import initialize from "occt-import-js";
import wasmUrl from "occt-import-js/dist/occt-import-js.wasm?url";
import { validateCadMeshes, type CadAssemblyNode, type CadAssemblySourceNode, type CadGeometryResult } from "./cadGeometry";
import { encodeCadMeshesAsGlb } from "./encodeCadGlb";

self.onmessage = async (event: MessageEvent<{ buffer: ArrayBuffer; output: "meshes" | "glb" }>) => {
  try {
    const occt = await initialize({ locateFile: () => wasmUrl });
    const result = occt.ReadStepFile(new Uint8Array(event.data.buffer), { linearUnit: "millimeter" });
    if (!result.success) throw new Error("Unable to read this STEP file. Re-export it as STEP AP203, AP214 or AP242.");
    const meshes = validateCadMeshes(result.meshes);
    const meshIndices = new Map(result.meshes.map((mesh, index) => [index, meshes.indexOf(mesh)]));
    const root = buildAssemblyNode(result.root, "root", meshIndices);
    if (event.data.output === "glb") {
      const glb = encodeCadMeshesAsGlb(meshes);
      self.postMessage({ glb }, { transfer: [glb] });
    } else {
      self.postMessage({ meshes, root } satisfies CadGeometryResult);
    }
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Unable to prepare the STEP geometry." } satisfies CadGeometryResult);
  }
};

function buildAssemblyNode(
  node: CadAssemblySourceNode,
  id: string,
  meshIndices: ReadonlyMap<number, number>,
): CadAssemblyNode {
  return {
    id,
    name: node.name,
    meshIndices: node.meshes.flatMap((index) => {
      const mappedIndex = meshIndices.get(index);
      return mappedIndex === undefined || mappedIndex < 0 ? [] : [mappedIndex];
    }),
    children: node.children.map((child, index) => buildAssemblyNode(child, `${id}/${index}`, meshIndices)),
  };
}
