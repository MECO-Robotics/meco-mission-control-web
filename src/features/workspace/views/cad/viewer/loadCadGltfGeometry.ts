import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { validateCadMeshes, type CadMesh } from "./cadGeometry";

export async function loadCadGltfGeometry(file: File, signal: AbortSignal): Promise<CadMesh[]> {
  if (signal.aborted) throw new DOMException("Canceled", "AbortError");
  const buffer = await file.arrayBuffer();
  if (signal.aborted) throw new DOMException("Canceled", "AbortError");
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(buffer, "");
  if (signal.aborted) throw new DOMException("Canceled", "AbortError");
  const meshes: CadMesh[] = [];
  gltf.scene.traverse((node) => {
    if (!(node as typeof node & { isMesh?: boolean }).isMesh) return;
    const mesh = node as typeof node & { geometry: import("three").BufferGeometry; material: import("three").Material | import("three").Material[] };
    const position = mesh.geometry.getAttribute("position");
    if (!position) return;
    const index = mesh.geometry.index?.array;
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const color = "color" in material && material.color instanceof Object
      ? (material.color as import("three").Color).toArray() as [number, number, number]
      : undefined;
    meshes.push({
      name: node.name,
      color,
      attributes: {
        position: { array: Array.from(position.array as ArrayLike<number>) },
        normal: mesh.geometry.getAttribute("normal")
          ? { array: Array.from(mesh.geometry.getAttribute("normal").array as ArrayLike<number>) }
          : undefined,
      },
      index: { array: index ? Array.from(index as ArrayLike<number>) : Array.from({ length: position.count }, (_value, index) => index) },
    });
  });
  return validateCadMeshes(meshes);
}
