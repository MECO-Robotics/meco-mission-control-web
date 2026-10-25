import type { CadAssemblyNode, CadMesh } from "./cadGeometry";

let mainAssemblyPromise: Promise<File> | null = null;

export function loadBundledMainAssembly(): Promise<File> {
  if (!mainAssemblyPromise) {
    mainAssemblyPromise = fetch("/cad/main-assembly.step.gzdata")
      .then(async (response) => {
        if (!response.ok || !response.body) throw new Error("The seeded robot CAD asset could not be loaded.");
        if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot decompress the seeded robot CAD asset.");
        const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
        const blob = await new Response(decompressed).blob();
        return new File([blob], "MAIN ASSEMBLY.step", { type: "application/step" });
      })
      .catch((error) => {
        mainAssemblyPromise = null;
        throw error;
      });
  }
  return mainAssemblyPromise;
}

export async function loadOptimizedRobotPreview(scope: { projectId?: string | null; seasonId?: string | null } = {}): Promise<File> {
  const params = new URLSearchParams();
  if (scope.projectId) params.set("projectId", scope.projectId);
  if (scope.seasonId) params.set("seasonId", scope.seasonId);
  const query = params.size ? `?${params.toString()}` : "";
  const response = await fetch(`/api/cad/optimized-preview${query}`, { credentials: "include" });
  if (response.ok) {
    const sourceName = decodeURIComponent(response.headers.get("X-CAD-Source-Name") ?? "Robot assembly.step");
    return new File([await response.blob()], sourceName.replace(/\.(step|stp)$/i, ".glb"), { type: "model/gltf-binary" });
  }
  const bundled = await fetch("/cad/main-assembly.glb.gzdata");
  if (!bundled.ok || !bundled.body) throw new Error("No optimized robot CAD preview is available.");
  if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot decompress the optimized robot CAD preview.");
  const decompressed = bundled.body.pipeThrough(new DecompressionStream("gzip"));
  const blob = await new Response(decompressed).blob();
  return new File([blob], "MAIN ASSEMBLY.glb", { type: "model/gltf-binary" });
}

export async function loadBundledAssemblyHierarchy(meshes: CadMesh[]): Promise<CadAssemblyNode | null> {
  const response = await fetch("/cad/main-assembly-hierarchy.json");
  if (!response.ok) return null;
  const metadata = await response.json() as { meshes: Array<{ vertexCount: number; indexCount: number }>; root: CadAssemblyNode };
  const matches = metadata.meshes.length === meshes.length && meshes.every((mesh, index) => {
    const signature = metadata.meshes[index];
    return signature.vertexCount === mesh.attributes.position.array.length / 3
      && signature.indexCount === mesh.index.array.length;
  });
  return matches ? metadata.root : null;
}
