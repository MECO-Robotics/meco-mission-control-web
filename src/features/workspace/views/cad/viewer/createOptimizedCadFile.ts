export async function createOptimizedCadFile(file: File): Promise<File> {
  const controller = new AbortController();
  const { loadCadGlb } = await import("./loadCadGeometry");
  const glb = await loadCadGlb(file, controller.signal);
  const baseName = file.name.replace(/\.(step|stp)$/i, "");
  return new File([glb], `${baseName}.glb`, { type: "model/gltf-binary" });
}
